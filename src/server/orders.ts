import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { generateToken, safeEqual } from "@/lib/auth/tokens";
import { invalidateCatalog } from "@/lib/cache";
import { TRACKING_STEPS } from "@/lib/constants";
import { digitsOnly } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import type { CheckoutValues } from "@/lib/validation/checkout";
import { stockState } from "@/server/catalog";
import { evaluateCoupon } from "@/server/coupons";
import {
  commitReservedStock,
  deductStock,
  OutOfStockError,
  releaseReservedStock,
  reserveStock,
  restock,
} from "@/server/inventory";
import { computeTotals } from "@/server/pricing";
import { getStoreSettings } from "@/server/settings";
import { shippingFeeFor } from "@/server/shipping";
import { orderConfirmationEmail, sendEmail } from "@/server/email";

type Tx = Prisma.TransactionClient;

/** RB-YYMMDD-XXXXX using an unambiguous alphabet. */
export function generateOrderNumber() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(5);
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  const d = new Date();
  const date = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `RB-${date}-${suffix}`;
}

export class CheckoutError extends Error {}

export function orderUrl(orderNumber: string, accessToken: string) {
  return `/order/${orderNumber}?token=${accessToken}`;
}

/**
 * Create an order from the visitor's cart. All prices, discounts, shipping and
 * tax are recomputed from the database; nothing from the client is trusted
 * except the customer's own details.
 */
export async function createOrderFromCart(input: {
  cartId: string;
  values: CheckoutValues;
  userId: string | null;
}) {
  const settings = await getStoreSettings();
  const { values } = input;

  if (values.paymentMethod === "COD" && !settings.codEnabled) throw new CheckoutError("Cash on delivery is unavailable.");
  if (values.paymentMethod === "RAZORPAY" && (!settings.razorpayEnabled || !env.razorpay.configured)) {
    throw new CheckoutError("Online payment is temporarily unavailable. Please choose cash on delivery.");
  }

  const cart = await db.cart.findUnique({
    where: { id: input.cartId },
    include: {
      items: {
        where: { savedForLater: false },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
              status: true,
              price: true,
              mrp: true,
              categoryId: true,
              conditionGrade: true,
              warrantyMonths: true,
              images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
              inventory: { select: { quantity: true, reserved: true, lowStockThreshold: true } },
            },
          },
        },
      },
    },
  });
  if (!cart || !cart.items.length) throw new CheckoutError("Your cart is empty.");

  const lines = cart.items.map((i) => {
    if (i.product.status !== "PUBLISHED") throw new CheckoutError(`${i.product.name} is no longer available.`);
    const { available } = stockState(i.product.inventory);
    if (available < i.quantity) throw new OutOfStockError(i.product.name);
    return { ...i.product, quantity: i.quantity };
  });

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  let coupon: { id: string; code: string; discount: number } | null = null;
  if (cart.couponCode) {
    const res = await evaluateCoupon(cart.couponCode, {
      lines: lines.map((l) => ({ productId: l.id, categoryId: l.categoryId, price: l.price, quantity: l.quantity })),
      userId: input.userId,
      email: values.customer.email,
    });
    if (!res.ok) throw new CheckoutError(res.error);
    coupon = { id: res.couponId, code: res.code, discount: res.discount };
  }

  if (
    values.paymentMethod === "COD" &&
    settings.codMaxOrderValue &&
    subtotal - (coupon?.discount ?? 0) > settings.codMaxOrderValue
  ) {
    throw new CheckoutError("Cash on delivery isn't available for this order value. Please pay online.");
  }

  const shipping = await shippingFeeFor(values.deliveryMethod, subtotal, values.address.state, values.address.pincode);
  const totals = computeTotals({
    lines,
    discount: coupon?.discount ?? 0,
    shipping: shipping.fee,
    codFee: values.paymentMethod === "COD" ? settings.codFee : 0,
    settings,
  });

  const orderNumber = generateOrderNumber();
  const accessToken = generateToken(24);
  const isCod = values.paymentMethod === "COD";

  const order = await db.$transaction(async (tx) => {
    const stockLines = lines.map((l) => ({ productId: l.id, quantity: l.quantity, name: l.name }));
    const created = await tx.order.create({
      data: {
        orderNumber,
        accessToken,
        userId: input.userId,
        customerName: values.customer.name,
        email: values.customer.email,
        phone: values.customer.phone,
        shippingAddress: {
          name: values.customer.name,
          phone: values.customer.phone,
          line1: values.address.line1,
          line2: values.address.line2 || null,
          landmark: values.address.landmark || null,
          city: values.address.city,
          state: values.address.state,
          pincode: values.address.pincode,
          country: "IN",
        },
        status: isCod ? "PROCESSING" : "PENDING",
        paymentMethod: values.paymentMethod,
        paymentStatus: "CREATED",
        deliveryMethod: values.deliveryMethod,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shippingFee: totals.shipping,
        codFee: totals.codFee,
        tax: totals.tax,
        total: totals.total,
        couponCode: coupon?.code ?? null,
        couponId: coupon?.id ?? null,
        notes: values.notes || null,
        stockReserved: !isCod,
        items: {
          create: lines.map((l) => ({
            productId: l.id,
            name: l.name,
            sku: l.sku,
            slug: l.slug,
            imageUrl: l.images[0]?.url ?? null,
            conditionGrade: l.conditionGrade,
            warrantyMonths: l.warrantyMonths,
            unitPrice: l.price,
            mrp: l.mrp,
            quantity: l.quantity,
            total: l.price * l.quantity,
          })),
        },
        events: {
          create: [
            { status: "PENDING", note: "Order placed" },
            ...(isCod ? [{ status: "PROCESSING" as const, note: "Cash on delivery order confirmed" }] : []),
          ],
        },
      },
    });

    if (isCod) {
      await deductStock(tx, created.id, stockLines);
      if (coupon) await redeemCoupon(tx, created.id, coupon, input.userId, values.customer.email, totals.discount);
      await tx.cartItem.deleteMany({ where: { cartId: cart.id, savedForLater: false } });
      await tx.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    } else {
      await reserveStock(tx, stockLines);
    }
    return created;
  });

  if (input.userId && values.saveAddress) {
    await saveAddressForUser(input.userId, values).catch(() => undefined);
  }
  if (isCod) {
    invalidateCatalog();
    await sendConfirmation(order.id);
  }
  return order;
}

async function saveAddressForUser(userId: string, values: CheckoutValues) {
  const exists = await db.address.findFirst({
    where: { userId, line1: values.address.line1, pincode: values.address.pincode },
    select: { id: true },
  });
  if (exists) return;
  const count = await db.address.count({ where: { userId } });
  await db.address.create({
    data: {
      userId,
      fullName: values.customer.name,
      phone: values.customer.phone,
      line1: values.address.line1,
      line2: values.address.line2 || null,
      landmark: values.address.landmark || null,
      city: values.address.city,
      state: values.address.state,
      pincode: values.address.pincode,
      isDefault: count === 0,
    },
  });
}

async function redeemCoupon(
  tx: Tx,
  orderId: string,
  coupon: { id: string },
  userId: string | null,
  email: string,
  amount: number,
) {
  await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
  await tx.couponRedemption.create({
    data: { couponId: coupon.id, orderId, userId, email: email.toLowerCase(), amount },
  });
}

async function sendConfirmation(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      orderNumber: true,
      accessToken: true,
      customerName: true,
      email: true,
      total: true,
      paymentMethod: true,
      items: { select: { name: true, quantity: true, total: true } },
    },
  });
  if (!order) return;
  const mail = orderConfirmationEmail({
    ...order,
    url: `${env.siteUrl}${orderUrl(order.orderNumber, order.accessToken)}`,
  });
  await sendEmail({ to: order.email, ...mail });
}

// ─── Payment state transitions (idempotent) ─────────────────

/** Mark a Razorpay payment captured. Safe to call from both the verify endpoint and the webhook. */
export async function markPaymentCaptured(input: {
  providerOrderId: string;
  providerPaymentId: string;
  amount?: number;
  method?: string | null;
  signature?: string | null;
  raw?: Prisma.InputJsonValue;
}) {
  const result = await db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { providerOrderId: input.providerOrderId },
      include: { order: { include: { items: true } } },
    });
    if (!payment) return { status: "unknown" as const };
    const order = payment.order;
    if (payment.status === "CAPTURED" || order.paymentStatus === "CAPTURED") {
      return { status: "already" as const, order };
    }
    if (input.amount !== undefined && input.amount !== payment.amount) {
      console.error("[payments] amount mismatch", input.providerOrderId, input.amount, payment.amount);
      return { status: "mismatch" as const, order };
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "CAPTURED",
        providerPaymentId: input.providerPaymentId,
        method: input.method ?? undefined,
        errorCode: null,
        errorDescription: null,
        raw: input.raw,
      },
    });

    const lines = order.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    if (order.status === "CANCELLED") {
      // Paid after the reservation expired. Keep it cancelled for manual refund review.
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "CAPTURED", paidAt: new Date() } });
      await tx.orderStatusEvent.create({
        data: { orderId: order.id, status: "CANCELLED", note: "Payment received after cancellation — refund required" },
      });
      return { status: "late" as const, order };
    }

    if (order.stockReserved) await commitReservedStock(tx, order.id, lines);
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", paymentStatus: "CAPTURED", paidAt: new Date(), stockReserved: false },
    });
    await tx.orderStatusEvent.create({ data: { orderId: order.id, status: "PAID", note: "Payment confirmed" } });
    if (order.couponId) {
      const already = await tx.couponRedemption.findUnique({ where: { orderId: order.id } });
      if (!already) await redeemCoupon(tx, order.id, { id: order.couponId }, order.userId, order.email, order.discount);
    }
    return { status: "captured" as const, order };
  });

  if (result.status === "captured") {
    invalidateCatalog();
    await sendConfirmation(result.order.id);
  }
  return result;
}

export async function markPaymentFailed(input: {
  providerOrderId: string;
  providerPaymentId?: string | null;
  code?: string | null;
  description?: string | null;
}) {
  const payment = await db.payment.findUnique({ where: { providerOrderId: input.providerOrderId } });
  if (!payment || payment.status === "CAPTURED") return;
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "FAILED",
      providerPaymentId: input.providerPaymentId ?? payment.providerPaymentId,
      errorCode: input.code?.slice(0, 80) ?? null,
      errorDescription: input.description?.slice(0, 300) ?? null,
    },
  });
  await db.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "FAILED" } });
}

export async function markRefunded(providerPaymentId: string) {
  const payment = await db.payment.findUnique({ where: { providerPaymentId } });
  if (!payment || payment.status === "REFUNDED") return;
  await db.$transaction([
    db.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } }),
    db.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "REFUNDED", status: "REFUNDED" } }),
    db.orderStatusEvent.create({ data: { orderId: payment.orderId, status: "REFUNDED", note: "Refund processed" } }),
  ]);
}

/** Cancel unpaid online orders whose stock reservation is older than `minutes`. */
export async function releaseExpiredReservations(minutes = 30) {
  const cutoff = new Date(Date.now() - minutes * 60_000);
  const stale = await db.order.findMany({
    where: {
      stockReserved: true,
      paymentStatus: { in: ["CREATED", "FAILED"] },
      status: { in: ["PENDING", "PAYMENT_PROCESSING"] },
      createdAt: { lt: cutoff },
    },
    include: { items: true },
    take: 200,
  });
  for (const order of stale) {
    await db.$transaction(async (tx) => {
      const fresh = await tx.order.findUnique({ where: { id: order.id }, select: { stockReserved: true } });
      if (!fresh?.stockReserved) return;
      await releaseReservedStock(tx, order.items);
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", cancelledAt: new Date(), stockReserved: false },
      });
      await tx.orderStatusEvent.create({
        data: { orderId: order.id, status: "CANCELLED", note: "Payment not completed — reservation released" },
      });
    });
  }
  if (stale.length) invalidateCatalog();
  return stale.length;
}

let lastSweep = 0;

/**
 * Opportunistic cleanup, so stock held by abandoned online payments is freed
 * even without a frequent cron (Vercel Hobby only allows daily cron jobs).
 * Runs at most once every 5 minutes per server instance; failures never
 * affect the caller.
 */
export async function sweepExpiredReservations() {
  const now = Date.now();
  if (now - lastSweep < 5 * 60_000) return;
  lastSweep = now;
  try {
    await releaseExpiredReservations(30);
  } catch (err) {
    console.error("[orders] reservation sweep failed", err);
  }
}

// ─── Admin status updates ───────────────────────────────────

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAYMENT_PROCESSING", "PAID", "PROCESSING", "CANCELLED"],
  PAYMENT_PROCESSING: ["PAID", "PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING", "PACKED", "SHIPPED", "CANCELLED", "REFUNDED"],
  PROCESSING: ["PACKED", "SHIPPED", "CANCELLED", "REFUNDED"],
  PACKED: ["SHIPPED", "PROCESSING", "CANCELLED", "REFUNDED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "REFUNDED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "SHIPPED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function allowedNextStatuses(status: OrderStatus) {
  return ALLOWED_TRANSITIONS[status];
}

export async function updateOrderStatus(input: {
  orderId: string;
  status: OrderStatus;
  note?: string;
  courier?: string;
  trackingNumber?: string;
  userId: string;
}) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: input.orderId }, include: { items: true } });
    if (order.status !== input.status && !ALLOWED_TRANSITIONS[order.status].includes(input.status)) {
      throw new Error(`Cannot move an order from ${order.status} to ${input.status}.`);
    }
    const lines = order.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    const data: Prisma.OrderUpdateInput = {
      status: input.status,
      courier: input.courier ?? undefined,
      trackingNumber: input.trackingNumber ?? undefined,
    };

    if (input.status === "CANCELLED" || input.status === "REFUNDED") {
      if (order.stockReserved) {
        await releaseReservedStock(tx, lines);
        data.stockReserved = false;
      } else if (order.status !== "CANCELLED" && order.status !== "REFUNDED" && order.status !== "DELIVERED") {
        await restock(tx, order.id, lines, `Order ${input.status.toLowerCase()}`, input.userId);
      }
      if (input.status === "CANCELLED") data.cancelledAt = new Date();
    }
    if (input.status === "PAID" && order.paymentMethod === "COD") data.paymentStatus = "CAPTURED";
    if (input.status === "DELIVERED" && order.paymentMethod === "COD") {
      data.paymentStatus = "CAPTURED";
      data.paidAt = order.paidAt ?? new Date();
    }

    await tx.order.update({ where: { id: order.id }, data });
    if (order.status !== input.status || input.note) {
      await tx.orderStatusEvent.create({
        data: { orderId: order.id, status: input.status, note: input.note || null, userId: input.userId },
      });
    }
  });
  invalidateCatalog();
}

// ─── Customer access & tracking ─────────────────────────────

const customerOrderInclude = {
  items: true,
  events: { orderBy: { createdAt: "asc" as const } },
  payments: { orderBy: { createdAt: "desc" as const }, take: 1 },
};

export async function getOrderForViewer(orderNumber: string, opts: { token?: string | null; userId?: string | null }) {
  const order = await db.order.findUnique({ where: { orderNumber }, include: customerOrderInclude });
  if (!order) return null;
  const ownsIt = opts.userId && order.userId === opts.userId;
  const hasToken = opts.token && safeEqual(opts.token, order.accessToken);
  return ownsIt || hasToken ? order : null;
}

export async function findOrderForTracking(orderNumber: string, contact: string) {
  const order = await db.order.findUnique({ where: { orderNumber }, include: customerOrderInclude });
  if (!order) return null;
  const c = contact.trim().toLowerCase();
  const phoneMatch = digitsOnly(c).length >= 10 && digitsOnly(order.phone).endsWith(digitsOnly(c).slice(-10));
  return order.email.toLowerCase() === c || phoneMatch ? order : null;
}

export type CustomerOrder = NonNullable<Awaited<ReturnType<typeof getOrderForViewer>>>;

/** Build the 7-step customer timeline from the order's status history. */
export function buildTimeline(order: {
  status: OrderStatus;
  paymentMethod: "RAZORPAY" | "COD";
  placedAt: Date;
  events: { status: OrderStatus; createdAt: Date; note: string | null }[];
}) {
  const firstAt = (statuses: OrderStatus[]) =>
    order.events.find((e) => statuses.includes(e.status))?.createdAt ?? null;
  const rank: Record<string, number> = {
    PENDING: 0,
    PAYMENT_PROCESSING: 0,
    PAID: 1,
    PROCESSING: 2,
    PACKED: 3,
    SHIPPED: 4,
    OUT_FOR_DELIVERY: 5,
    DELIVERED: 6,
  };
  const current = rank[order.status] ?? -1;
  const stepStatuses: Record<(typeof TRACKING_STEPS)[number]["key"], OrderStatus[]> = {
    PLACED: ["PENDING"],
    CONFIRMED: order.paymentMethod === "COD" ? ["PROCESSING", "PAID"] : ["PAID"],
    PROCESSING: ["PROCESSING"],
    PACKED: ["PACKED"],
    SHIPPED: ["SHIPPED"],
    OUT_FOR_DELIVERY: ["OUT_FOR_DELIVERY"],
    DELIVERED: ["DELIVERED"],
  };
  return TRACKING_STEPS.map((step, index) => {
    const label = step.key === "CONFIRMED" && order.paymentMethod === "COD" ? "Order confirmed" : step.label;
    const at = step.key === "PLACED" ? order.placedAt : firstAt(stepStatuses[step.key]);
    const done = index <= current || (index === 1 && order.paymentMethod === "COD" && current >= 2);
    return { key: step.key, label, at: at ? at.toISOString() : null, done, current: index === current };
  });
}
