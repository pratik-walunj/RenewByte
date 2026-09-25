/**
 * Client-safe order view helpers shared by the account, confirmation and
 * tracking pages. Only type imports from server modules are used here.
 */
import type { ConditionGrade, OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";
import type { buildTimeline, CustomerOrder } from "@/server/orders";

export type TimelineStep = ReturnType<typeof buildTimeline>[number];

export type ShippingAddressView = {
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
};

/** The order's `shippingAddress` is a JSON snapshot — read it defensively. */
export function parseShippingAddress(value: unknown): ShippingAddressView | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const str = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");
  if (!str("line1")) return null;
  return {
    name: str("name"),
    phone: str("phone"),
    line1: str("line1"),
    line2: str("line2") || null,
    landmark: str("landmark") || null,
    city: str("city"),
    state: str("state"),
    pincode: str("pincode"),
  };
}

export type OrderItemView = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  imageUrl: string | null;
  conditionGrade: ConditionGrade;
  warrantyMonths: number;
  unitPrice: number;
  mrp: number;
  quantity: number;
  total: number;
};

export function toItemView(item: CustomerOrder["items"][number]): OrderItemView {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    sku: item.sku,
    imageUrl: item.imageUrl,
    conditionGrade: item.conditionGrade,
    warrantyMonths: item.warrantyMonths,
    unitPrice: item.unitPrice,
    mrp: item.mrp,
    quantity: item.quantity,
    total: item.total,
  };
}

export type OrderTotalsView = {
  subtotal: number;
  discount: number;
  shippingFee: number;
  codFee: number;
  tax: number;
  total: number;
  couponCode: string | null;
};

export function toTotalsView(order: OrderTotalsView): OrderTotalsView {
  return {
    subtotal: order.subtotal,
    discount: order.discount,
    shippingFee: order.shippingFee,
    codFee: order.codFee,
    tax: order.tax,
    total: order.total,
    couponCode: order.couponCode,
  };
}

/** What the public tracking form returns. Deliberately excludes the address and contact details. */
export type TrackingView = {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  placedAt: string;
  cancelledAt: string | null;
  courier: string | null;
  trackingNumber: string | null;
  deliveryCity: string | null;
  total: number;
  items: Pick<OrderItemView, "id" | "name" | "slug" | "imageUrl" | "conditionGrade" | "quantity">[];
  timeline: TimelineStep[];
  lastUpdate: { status: OrderStatus; note: string | null; at: string } | null;
};

export function toTrackingView(order: CustomerOrder, timeline: TimelineStep[]): TrackingView {
  const address = parseShippingAddress(order.shippingAddress);
  const last = order.events.at(-1);
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    placedAt: order.placedAt.toISOString(),
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    courier: order.courier,
    trackingNumber: order.trackingNumber,
    deliveryCity: address ? [address.city, address.state].filter(Boolean).join(", ") : null,
    total: order.total,
    items: order.items.map((i) => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      imageUrl: i.imageUrl,
      conditionGrade: i.conditionGrade,
      quantity: i.quantity,
    })),
    timeline,
    lastUpdate: last ? { status: last.status, note: last.note, at: last.createdAt.toISOString() } : null,
  };
}

/** An online order that hasn't been paid but still holds its stock — payment can be retried. */
export function canRetryPayment(order: {
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  stockReserved: boolean;
}) {
  return (
    order.paymentMethod === "RAZORPAY" &&
    order.paymentStatus !== "CAPTURED" &&
    order.stockReserved &&
    (order.status === "PENDING" || order.status === "PAYMENT_PROCESSING")
  );
}

/** Route param → canonical order number (tolerates lower case and stray encoding). */
export function normaliseOrderNumber(raw: string) {
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    /* malformed escape — use as-is */
  }
  return value.trim().toUpperCase().slice(0, 40);
}

export function isClosedStatus(status: OrderStatus) {
  return status === "CANCELLED" || status === "REFUNDED";
}

// Order times are always shown in India time, whatever the server's timezone.
const TZ = "Asia/Kolkata";
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const shortDateFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: TZ,
});

const toDate = (v: Date | string) => (typeof v === "string" ? new Date(v) : v);
export const formatOrderDate = (v: Date | string) => dateFmt.format(toDate(v));
export const formatOrderShortDate = (v: Date | string) => shortDateFmt.format(toDate(v));
export const formatOrderDateTime = (v: Date | string) => dateTimeFmt.format(toDate(v));

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  RAZORPAY: "Online payment (Razorpay)",
  COD: "Cash on delivery",
};
