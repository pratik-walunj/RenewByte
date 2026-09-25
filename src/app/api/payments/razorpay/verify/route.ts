import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";
import { getOrCreateCart } from "@/server/cart";
import { markPaymentCaptured } from "@/server/orders";
import { fetchRazorpayPayment, verifyCheckoutSignature } from "@/server/payments/razorpay";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
});

/**
 * Called by the browser after Razorpay Checkout reports success. The browser's
 * word is never trusted: the signature is verified and the payment is fetched
 * from Razorpay to confirm its status and amount before the order is marked paid.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`verify:${ip}`, 20, 60_000).ok) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  if (!verifyCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ ok: false, error: "Payment verification failed" }, { status: 400 });
  }

  let payment;
  try {
    payment = await fetchRazorpayPayment(razorpay_payment_id);
  } catch (err) {
    console.error("[verify] payment lookup failed", err);
    // Signature is valid; the webhook will reconcile the final state.
    return NextResponse.json({ ok: true, pending: true });
  }
  if (payment.order_id !== razorpay_order_id) {
    return NextResponse.json({ ok: false, error: "Payment does not match order" }, { status: 400 });
  }
  if (payment.status !== "captured") {
    if (payment.status === "authorized") {
      await db.payment.updateMany({
        where: { providerOrderId: razorpay_order_id, status: { not: "CAPTURED" } },
        data: { status: "AUTHORIZED", providerPaymentId: razorpay_payment_id },
      });
    }
    return NextResponse.json({ ok: true, pending: true });
  }

  const result = await markPaymentCaptured({
    providerOrderId: razorpay_order_id,
    providerPaymentId: razorpay_payment_id,
    amount: payment.amount,
    method: payment.method,
    signature: razorpay_signature,
  });
  if (result.status === "unknown" || result.status === "mismatch") {
    return NextResponse.json({ ok: false, error: "Payment could not be matched to an order" }, { status: 400 });
  }

  // Clear the purchased items from this visitor's cart.
  try {
    const cart = await getOrCreateCart();
    const productIds = result.order.items.map((i) => i.productId).filter((id): id is string => !!id);
    await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: { in: productIds }, savedForLater: false } });
    await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  } catch {
    /* non-critical */
  }

  return NextResponse.json({ ok: true, orderNumber: result.order.orderNumber });
}
