"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { safeEqual } from "@/lib/auth/tokens";
import { limitByIp } from "@/lib/rate-limit";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation/checkout";
import { getCartView, getOrCreateCart } from "@/server/cart";
import { computeTotals } from "@/server/pricing";
import { getStoreSettings } from "@/server/settings";
import { quoteShipping } from "@/server/shipping";
import { OutOfStockError, releaseReservedStock } from "@/server/inventory";
import { CheckoutError, createOrderFromCart, orderUrl, sweepExpiredReservations } from "@/server/orders";
import { createRazorpayOrder } from "@/server/payments/razorpay";
import { getSiteSettings } from "@/lib/cms";

export type RazorpayCheckoutData = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  businessName: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
};

export type PlaceOrderResult =
  | { ok: true; kind: "cod"; orderNumber: string; redirectTo: string; total: number }
  | { ok: true; kind: "razorpay"; orderNumber: string; redirectTo: string; total: number; payment: RazorpayCheckoutData }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

async function openRazorpayPayment(orderId: string): Promise<RazorpayCheckoutData> {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const site = await getSiteSettings();
  let providerOrderId = order.payments[0]?.providerOrderId;

  // Razorpay orders accept multiple attempts, so a retry reuses the same order id.
  if (!providerOrderId || order.payments[0]?.amount !== order.total) {
    const rzp = await createRazorpayOrder({
      amount: order.total,
      receipt: order.orderNumber,
      notes: { orderNumber: order.orderNumber },
    });
    providerOrderId = rzp.id;
    await db.payment.create({
      data: { orderId: order.id, providerOrderId: rzp.id, amount: order.total, currency: "INR" },
    });
  }
  if (order.status === "PENDING") {
    await db.order.update({ where: { id: order.id }, data: { status: "PAYMENT_PROCESSING" } });
    await db.orderStatusEvent.create({ data: { orderId: order.id, status: "PAYMENT_PROCESSING", note: "Awaiting online payment" } });
  }
  return {
    keyId: env.razorpay.keyId,
    razorpayOrderId: providerOrderId,
    amount: order.total,
    currency: "INR",
    businessName: site.businessName,
    description: `Order ${order.orderNumber}`,
    prefill: { name: order.customerName, email: order.email, contact: order.phone },
  };
}

export async function placeOrder(input: CheckoutInput): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!(await limitByIp("checkout", 10, 10 * 60_000)).ok) {
    return { ok: false, error: "Too many checkout attempts. Please wait a few minutes." };
  }

  const user = await getCurrentUser();
  const cart = await getOrCreateCart();
  // Free stock held by abandoned payments before checking availability.
  await sweepExpiredReservations();

  let order;
  try {
    order = await createOrderFromCart({ cartId: cart.id, values: parsed.data, userId: user?.id ?? null });
  } catch (err) {
    if (err instanceof CheckoutError || err instanceof OutOfStockError) return { ok: false, error: err.message };
    console.error("[checkout] order creation failed", err);
    return { ok: false, error: "We couldn't place your order. Please try again." };
  }

  const redirectTo = orderUrl(order.orderNumber, order.accessToken);
  if (order.paymentMethod === "COD") {
    return { ok: true, kind: "cod", orderNumber: order.orderNumber, redirectTo, total: order.total };
  }

  try {
    const payment = await openRazorpayPayment(order.id);
    return { ok: true, kind: "razorpay", orderNumber: order.orderNumber, redirectTo, total: order.total, payment };
  } catch (err) {
    console.error("[checkout] razorpay order failed", err);
    // Undo the reservation so stock isn't locked by an order that can't be paid.
    const items = await db.orderItem.findMany({ where: { orderId: order.id } });
    await db.$transaction(async (tx) => {
      await releaseReservedStock(tx, items);
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", stockReserved: false, cancelledAt: new Date() },
      });
      await tx.orderStatusEvent.create({
        data: { orderId: order.id, status: "CANCELLED", note: "Payment gateway unavailable" },
      });
    });
    return { ok: false, error: "Online payment is temporarily unavailable. Please try again or choose cash on delivery." };
  }
}

const previewSchema = z.object({
  state: z.string().max(60).optional(),
  pincode: z.string().max(6).optional(),
  deliveryMethod: z.enum(["STANDARD", "EXPRESS"]),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
});

/** Totals + delivery options for the current cart and destination (display only — recomputed on placement). */
export async function previewCheckout(input: z.input<typeof previewSchema>) {
  const parsed = previewSchema.safeParse(input);
  if (!parsed.success) return null;
  const { state, pincode, deliveryMethod, paymentMethod } = parsed.data;
  const [view, settings] = await Promise.all([getCartView(), getStoreSettings()]);
  const discountedSubtotal = view.totals.subtotal - view.totals.discount;
  const quotes = await quoteShipping({
    subtotal: view.totals.subtotal,
    state: state || undefined,
    pincode: pincode && /^\d{6}$/.test(pincode) ? pincode : undefined,
    settings,
  });
  const shipping = quotes.find((q) => q.method === deliveryMethod) ?? quotes[0];
  const codAvailable =
    settings.codEnabled && (!settings.codMaxOrderValue || discountedSubtotal <= settings.codMaxOrderValue);
  const totals = computeTotals({
    lines: view.items.filter((i) => i.quantity > 0),
    discount: view.totals.discount,
    shipping: view.items.length ? shipping.fee : 0,
    codFee: paymentMethod === "COD" && codAvailable ? settings.codFee : 0,
    settings,
  });
  return {
    totals,
    quotes,
    codAvailable,
    codFee: settings.codFee,
    onlineAvailable: settings.razorpayEnabled && env.razorpay.configured,
  };
}

export type CheckoutPreview = NonNullable<Awaited<ReturnType<typeof previewCheckout>>>;

/** Re-open payment for an unpaid order (after a failed or dismissed attempt). */
export async function retryPayment(orderNumber: string, token: string) {
  if (!(await limitByIp("retry-payment", 10, 10 * 60_000)).ok) {
    return { ok: false as const, error: "Too many attempts. Please wait a few minutes." };
  }
  const order = await db.order.findUnique({ where: { orderNumber } });
  const user = await getCurrentUser();
  const allowed = order && ((token && safeEqual(token, order.accessToken)) || (user && order.userId === user.id));
  if (!order || !allowed) return { ok: false as const, error: "Order not found." };
  if (order.paymentMethod !== "RAZORPAY" || order.paymentStatus === "CAPTURED") {
    return { ok: false as const, error: "This order doesn't need payment." };
  }
  if (!order.stockReserved || !["PENDING", "PAYMENT_PROCESSING"].includes(order.status)) {
    return { ok: false as const, error: "This order has expired. Please place it again from your cart." };
  }
  try {
    return { ok: true as const, payment: await openRazorpayPayment(order.id) };
  } catch {
    return { ok: false as const, error: "Online payment is temporarily unavailable." };
  }
}
