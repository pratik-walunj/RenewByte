"use client";

import * as React from "react";
import { track } from "@/lib/analytics";
import { useStore } from "@/components/providers/store-provider";

type Item = { item_id: string; item_name: string; price: number; quantity: number };

/** Fires the analytics `purchase` event once per order per browser session. */
export function PurchaseTracker({ orderNumber, value, items }: { orderNumber: string; value: number; items: Item[] }) {
  const { refresh } = useStore();
  React.useEffect(() => {
    const key = `rb:purchase:${orderNumber}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage unavailable — still report once for this render */
    }
    track({ name: "purchase", transaction_id: orderNumber, value, items });
    // The server clears the purchased items from the cart; sync the header badge.
    void refresh();
    // Items are derived from the same order; the order number is the identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, refresh]);
  return null;
}
