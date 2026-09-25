import "server-only";
import type { DeliveryMethod } from "@/generated/prisma/enums";
import { getShippingZones, getStoreSettings, type StoreSettingsData } from "@/server/settings";

export type ShippingQuote = {
  method: DeliveryMethod;
  label: string;
  fee: number;
  minDays: number;
  maxDays: number;
  available: boolean;
};

/**
 * Configurable shipping:
 *  1. A matching ShippingZone (by pincode prefix, then state) sets the fee and ETA.
 *  2. Otherwise the flat fee from StoreSettings applies.
 *  3. Standard shipping is free once the subtotal reaches `freeShippingThreshold`
 *     (a threshold of 0 means standard shipping is always free unless a zone fee applies).
 *
 * The provider-agnostic `ShippingQuote` shape is what a courier integration
 * (Shiprocket, Delhivery, …) would return later.
 */
export async function quoteShipping(input: {
  subtotal: number;
  state?: string | null;
  pincode?: string | null;
  settings?: StoreSettingsData;
}): Promise<ShippingQuote[]> {
  const settings = input.settings ?? (await getStoreSettings());
  const zones = await getShippingZones();

  const zone =
    (input.pincode && zones.find((z) => z.pincodePrefixes.some((p) => input.pincode!.startsWith(p)))) ||
    (input.state && zones.find((z) => z.states.some((s) => s.toLowerCase() === input.state!.toLowerCase()))) ||
    null;

  const qualifiesForFree = settings.freeShippingThreshold > 0 && input.subtotal >= settings.freeShippingThreshold;
  const baseFee = zone ? zone.fee : settings.flatShippingFee;
  const standardFee = qualifiesForFree ? 0 : baseFee;
  const minDays = zone?.minDays ?? 3;
  const maxDays = zone?.maxDays ?? 7;

  const quotes: ShippingQuote[] = [
    { method: "STANDARD", label: "Standard delivery", fee: standardFee, minDays, maxDays, available: true },
  ];
  if (settings.expressEnabled) {
    quotes.push({
      method: "EXPRESS",
      label: "Express delivery",
      fee: zone?.expressFee ?? settings.expressShippingFee,
      minDays: Math.max(1, minDays - 2),
      maxDays: Math.max(2, maxDays - 3),
      available: true,
    });
  }
  return quotes;
}

export async function shippingFeeFor(method: DeliveryMethod, subtotal: number, state?: string, pincode?: string) {
  const quotes = await quoteShipping({ subtotal, state, pincode });
  const quote = quotes.find((q) => q.method === method && q.available) ?? quotes[0];
  return quote;
}
