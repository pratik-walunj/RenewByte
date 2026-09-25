/** Store settings + shipping zone schemas (client-safe). Money fields are rupees here, paise in the database. */
import { z } from "zod";

const rupees = (label: string) =>
  z.number({ error: `${label} must be a number.` }).min(0, `${label} can't be negative.`).max(10_000_000);

export const storeSettingsSchema = z.object({
  taxRatePercent: z.number({ error: "Enter a rate." }).min(0).max(40),
  pricesIncludeTax: z.boolean(),
  freeShippingThresholdRupees: rupees("Threshold"),
  flatShippingFeeRupees: rupees("Fee"),
  expressEnabled: z.boolean(),
  expressShippingFeeRupees: rupees("Express fee"),
  codEnabled: z.boolean(),
  codFeeRupees: rupees("COD fee"),
  codMaxOrderRupees: rupees("Maximum").positive("Must be above zero.").nullable(),
  razorpayEnabled: z.boolean(),
  lowStockThreshold: z.number({ error: "Enter a number." }).int().min(0).max(1000),
});

export type StoreSettingsValues = z.infer<typeof storeSettingsSchema>;

export const shippingZoneSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required.").max(80),
    states: z.array(z.string().min(1).max(80)).max(40),
    pincodePrefixes: z
      .string()
      .trim()
      .max(2000)
      .refine(
        (v) => v === "" || v.split(/[\s,]+/).filter(Boolean).every((p) => /^\d{1,6}$/.test(p)),
        "Use 1–6 digit prefixes separated by commas.",
      ),
    feeRupees: rupees("Fee"),
    expressFeeRupees: rupees("Express fee").nullable(),
    minDays: z.number({ error: "Enter a number." }).int().min(0).max(60),
    maxDays: z.number({ error: "Enter a number." }).int().min(0).max(60),
    isActive: z.boolean(),
    sortOrder: z.number({ error: "Enter a number." }).int().min(-1000).max(1000),
  })
  .superRefine((v, ctx) => {
    if (v.maxDays < v.minDays) ctx.addIssue({ code: "custom", path: ["maxDays"], message: "Must be at least the minimum." });
    if (v.states.length === 0 && !v.pincodePrefixes.trim()) {
      ctx.addIssue({ code: "custom", path: ["states"], message: "Choose at least one state or enter pincode prefixes." });
    }
  });

export type ShippingZoneValues = z.infer<typeof shippingZoneSchema>;

export function parsePrefixes(value: string) {
  return [...new Set(value.split(/[\s,]+/).filter(Boolean))];
}
