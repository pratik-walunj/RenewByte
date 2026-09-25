import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export type CouponLine = { productId: string; categoryId: string; price: number; quantity: number };

export type CouponResult =
  | { ok: true; couponId: string; code: string; discount: number; description: string | null }
  | { ok: false; error: string };

/**
 * Server-side coupon validation. Never trust a discount computed on the client.
 * `tx` lets order placement re-validate inside its transaction.
 */
export async function evaluateCoupon(
  rawCode: string,
  ctx: { lines: CouponLine[]; userId?: string | null; email?: string | null },
  tx: Prisma.TransactionClient | typeof db = db,
): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code || code.length > 40) return { ok: false, error: "Enter a valid coupon code." };

  const coupon = await tx.coupon.findUnique({
    where: { code },
    include: { products: { select: { id: true } }, categories: { select: { id: true } } },
  });
  if (!coupon || !coupon.isActive) return { ok: false, error: "This coupon code isn't valid." };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, error: "This coupon isn't active yet." };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, error: "This coupon has expired." };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, error: "This coupon has reached its usage limit." };
  }

  if (coupon.perUserLimit !== null && (ctx.userId || ctx.email)) {
    const used = await tx.couponRedemption.count({
      where: {
        couponId: coupon.id,
        OR: [
          ...(ctx.userId ? [{ userId: ctx.userId }] : []),
          ...(ctx.email ? [{ email: ctx.email.toLowerCase() }] : []),
        ],
      },
    });
    if (used >= coupon.perUserLimit) return { ok: false, error: "You've already used this coupon." };
  }

  const productIds = new Set(coupon.products.map((p) => p.id));
  const categoryIds = new Set(coupon.categories.map((c) => c.id));
  const scoped = productIds.size > 0 || categoryIds.size > 0;
  const eligible = scoped
    ? ctx.lines.filter((l) => productIds.has(l.productId) || categoryIds.has(l.categoryId))
    : ctx.lines;
  if (!eligible.length) return { ok: false, error: "This coupon doesn't apply to the items in your cart." };

  const cartSubtotal = ctx.lines.reduce((s, l) => s + l.price * l.quantity, 0);
  if (cartSubtotal < coupon.minOrderValue) {
    const need = Math.ceil((coupon.minOrderValue - cartSubtotal) / 100);
    return { ok: false, error: `Add ₹${need.toLocaleString("en-IN")} more to use this coupon.` };
  }

  const eligibleSubtotal = eligible.reduce((s, l) => s + l.price * l.quantity, 0);
  let discount =
    coupon.type === "PERCENTAGE" ? Math.round((eligibleSubtotal * Math.min(coupon.value, 100)) / 100) : coupon.value;
  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, eligibleSubtotal);

  return { ok: true, couponId: coupon.id, code: coupon.code, discount, description: coupon.description };
}
