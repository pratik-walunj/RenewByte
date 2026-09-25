import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { markPaymentCaptured, markPaymentFailed, markRefunded } from "@/server/orders";
import { verifyWebhookSignature } from "@/server/payments/razorpay";

/**
 * Razorpay webhook. Configure in Dashboard → Webhooks with events:
 *   payment.captured, payment.failed, order.paid, refund.processed
 * URL: https://<your-domain>/api/payments/razorpay/webhook
 */
type WebhookPayload = {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        status: string;
        method?: string;
        error_code?: string | null;
        error_description?: string | null;
      };
    };
    refund?: { entity: { id: string; payment_id: string } };
  };
};

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!signature || !verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const eventId = req.headers.get("x-razorpay-event-id");
  if (eventId) {
    const seen = await db.webhookEvent.findUnique({ where: { id: eventId } });
    if (seen) return NextResponse.json({ ok: true, duplicate: true });
  }

  let body: WebhookPayload;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const payment = body.payload.payment?.entity;
  try {
    switch (body.event) {
      case "payment.captured":
      case "order.paid":
        if (payment) {
          await markPaymentCaptured({
            providerOrderId: payment.order_id,
            providerPaymentId: payment.id,
            amount: payment.amount,
            method: payment.method,
          });
        }
        break;
      case "payment.failed":
        if (payment) {
          await markPaymentFailed({
            providerOrderId: payment.order_id,
            providerPaymentId: payment.id,
            code: payment.error_code,
            description: payment.error_description,
          });
        }
        break;
      case "refund.processed":
        if (body.payload.refund) await markRefunded(body.payload.refund.entity.payment_id);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("[webhook] processing failed", body.event, err);
    // 500 makes Razorpay retry later.
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (eventId) {
    await db.webhookEvent
      .create({ data: { id: eventId, provider: "razorpay", event: body.event } })
      .catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
