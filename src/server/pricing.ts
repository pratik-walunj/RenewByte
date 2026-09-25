import "server-only";
import type { CartTotals } from "@/lib/types";
import type { StoreSettingsData } from "@/server/settings";

/**
 * Totals for a set of lines. Prices are stored tax-inclusive by default (as is
 * customary in India), in which case `tax` is the GST component already included.
 */
export function computeTotals(input: {
  lines: { price: number; mrp: number; quantity: number }[];
  discount: number;
  shipping: number;
  codFee?: number;
  settings: Pick<StoreSettingsData, "taxRateBps" | "pricesIncludeTax">;
}): CartTotals {
  const subtotal = input.lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const mrpTotal = input.lines.reduce((s, l) => s + Math.max(l.mrp, l.price) * l.quantity, 0);
  const discount = Math.min(input.discount, subtotal);
  const codFee = input.codFee ?? 0;
  const taxable = subtotal - discount;
  const rate = input.settings.taxRateBps / 10_000;

  let tax: number;
  let total: number;
  if (input.settings.pricesIncludeTax) {
    tax = Math.round(taxable - taxable / (1 + rate));
    total = taxable + input.shipping + codFee;
  } else {
    tax = Math.round(taxable * rate);
    total = taxable + tax + input.shipping + codFee;
  }
  return {
    subtotal,
    mrpTotal,
    discount,
    shipping: input.shipping,
    codFee,
    tax,
    total,
    taxIncluded: input.settings.pricesIncludeTax,
  };
}
