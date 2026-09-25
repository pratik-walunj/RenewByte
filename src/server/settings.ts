import "server-only";
import { db } from "@/lib/db";
import { cached, TAGS } from "@/lib/cache";

export const DEFAULT_STORE_SETTINGS = {
  id: "default",
  currency: "INR",
  taxRateBps: 1800,
  pricesIncludeTax: true,
  freeShippingThreshold: 0,
  flatShippingFee: 0,
  expressShippingFee: 49900,
  expressEnabled: true,
  codEnabled: true,
  codFee: 0,
  codMaxOrderValue: null as number | null,
  razorpayEnabled: true,
  lowStockThreshold: 3,
};

export type StoreSettingsData = typeof DEFAULT_STORE_SETTINGS;

export const getStoreSettings = cached(
  async (): Promise<StoreSettingsData> => {
    const row = await db.storeSettings.findUnique({ where: { id: "default" } });
    if (!row) return DEFAULT_STORE_SETTINGS;
    const { updatedAt: _u, ...rest } = row;
    return rest;
  },
  ["store-settings"],
  { tags: [TAGS.settings] },
);

export const getShippingZones = cached(
  async () =>
    db.shippingZone.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        states: true,
        pincodePrefixes: true,
        fee: true,
        expressFee: true,
        minDays: true,
        maxDays: true,
      },
    }),
  ["shipping-zones"],
  { tags: [TAGS.settings] },
);
