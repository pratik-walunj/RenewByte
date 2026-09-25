"use server";

import { limitByIp } from "@/lib/rate-limit";
import { trackOrderSchema } from "@/lib/validation/checkout";
import { buildTimeline, findOrderForTracking } from "@/server/orders";
import { toTrackingView, type TrackingView } from "@/components/orders/order-view";

export type TrackOrderResult =
  | { ok: true; order: TrackingView }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

const NOT_FOUND = "We couldn't find an order matching those details. Check the order number and use the email or phone number you ordered with.";

/**
 * Public order lookup. Rate-limited per IP, and the same message is returned
 * whether the order number doesn't exist or the contact doesn't match.
 */
export async function trackOrder(input: { orderNumber: string; contact: string }): Promise<TrackOrderResult> {
  const parsed = trackOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!(await limitByIp("track-order", 10, 10 * 60_000)).ok) {
    return { ok: false, error: "Too many lookups. Please wait a few minutes and try again." };
  }
  const order = await findOrderForTracking(parsed.data.orderNumber, parsed.data.contact);
  if (!order) return { ok: false, error: NOT_FOUND };
  return { ok: true, order: toTrackingView(order, buildTimeline(order)) };
}
