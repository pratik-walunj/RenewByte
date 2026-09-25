"use client";

/**
 * Provider-agnostic analytics. Events are pushed to the GTM dataLayer, sent to
 * GA4 via gtag and mirrored to the Meta Pixel when those scripts are loaded.
 * IDs are configured in the CMS or environment — never hard-coded.
 */
type Item = { item_id: string; item_name: string; item_brand?: string; price?: number; quantity?: number };

export type AnalyticsEvent =
  | { name: "view_item"; item: Item }
  | { name: "search"; search_term: string }
  | { name: "add_to_cart"; item: Item }
  | { name: "add_to_wishlist"; item: Item }
  | { name: "begin_checkout"; value: number; items: Item[] }
  | { name: "purchase"; transaction_id: string; value: number; items?: Item[] }
  | { name: "whatsapp_click"; location: string; product?: string };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const META_EVENT: Partial<Record<AnalyticsEvent["name"], string>> = {
  view_item: "ViewContent",
  search: "Search",
  add_to_cart: "AddToCart",
  add_to_wishlist: "AddToWishlist",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
  whatsapp_click: "Contact",
};

/** Prices are passed in paise and converted to rupees here. */
export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  const { name, ...rest } = event;
  const toRupees = (i: Item) => ({ ...i, price: i.price !== undefined ? i.price / 100 : undefined });
  const params: Record<string, unknown> = { currency: "INR", ...rest };
  if ("item" in event) {
    params.items = [toRupees(event.item)];
    params.value = (event.item.price ?? 0) / 100;
    delete params.item;
  }
  if ("items" in event && event.items) params.items = event.items.map(toRupees);
  if ("value" in event && typeof event.value === "number" && !("item" in event)) params.value = event.value / 100;

  try {
    window.dataLayer?.push({ event: name, ecommerce: params });
    window.gtag?.("event", name, params);
    const meta = META_EVENT[name];
    if (meta && window.fbq) window.fbq("track", meta, { value: params.value, currency: "INR" });
  } catch {
    /* analytics must never break the UI */
  }
}
