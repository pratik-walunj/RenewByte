import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";
import { markPaymentFailed } from "@/server/orders";

const schema = z.object({
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().max(64).optional().nullable(),
  code: z.string().max(80).optional().nullable(),
  description: z.string().max(300).optional().nullable(),
});

/**
 * Records a failed attempt reported by Checkout.js. This can only ever mark a
 * payment as failed (never paid), and a captured payment is left untouched.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`pay-fail:${ip}`, 20, 60_000).ok) return NextResponse.json({ ok: false }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  await markPaymentFailed({
    providerOrderId: parsed.data.razorpay_order_id,
    providerPaymentId: parsed.data.razorpay_payment_id,
    code: parsed.data.code,
    description: parsed.data.description,
  });
  return NextResponse.json({ ok: true });
}
