import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { paiseToRupees } from "@/lib/format";
import { DEFAULT_STORE_SETTINGS } from "@/server/settings";
import type { ShippingZoneValues, StoreSettingsValues } from "@/server/admin/schemas/settings";

/** Uncached read for the settings form (the storefront uses the cached getter). */
export async function getSettingsForm(): Promise<StoreSettingsValues> {
  const s = (await db.storeSettings.findUnique({ where: { id: "default" } })) ?? DEFAULT_STORE_SETTINGS;
  return {
    taxRatePercent: s.taxRateBps / 100,
    pricesIncludeTax: s.pricesIncludeTax,
    freeShippingThresholdRupees: paiseToRupees(s.freeShippingThreshold),
    flatShippingFeeRupees: paiseToRupees(s.flatShippingFee),
    expressEnabled: s.expressEnabled,
    expressShippingFeeRupees: paiseToRupees(s.expressShippingFee),
    codEnabled: s.codEnabled,
    codFeeRupees: paiseToRupees(s.codFee),
    codMaxOrderRupees: s.codMaxOrderValue === null ? null : paiseToRupees(s.codMaxOrderValue),
    razorpayEnabled: s.razorpayEnabled,
    lowStockThreshold: s.lowStockThreshold,
  };
}

export async function listShippingZones() {
  const zones = await db.shippingZone.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return zones.map((z) => ({
    id: z.id,
    values: {
      name: z.name,
      states: z.states,
      pincodePrefixes: z.pincodePrefixes.join(", "),
      feeRupees: paiseToRupees(z.fee),
      expressFeeRupees: z.expressFee === null ? null : paiseToRupees(z.expressFee),
      minDays: z.minDays,
      maxDays: z.maxDays,
      isActive: z.isActive,
      sortOrder: z.sortOrder,
    } satisfies ShippingZoneValues,
    fee: z.fee,
    expressFee: z.expressFee,
  }));
}

export type ZoneRow = Awaited<ReturnType<typeof listShippingZones>>[number];

/** Which integrations have credentials. Booleans only — secrets never leave the server. */
export function integrationStatus() {
  return {
    razorpay: env.razorpay.configured,
    razorpayWebhook: Boolean(env.razorpay.webhookSecret),
    cloudinary: env.cloudinary.configured,
    resend: Boolean(env.resendApiKey),
    cron: Boolean(env.cronSecret),
  };
}
