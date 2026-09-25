const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format an amount stored in paise as Indian rupees, e.g. 3499900 → "₹34,999". */
export function formatPrice(paise: number, opts: { precise?: boolean } = {}) {
  const rupees = paise / 100;
  if (opts.precise && !Number.isInteger(rupees)) return inrPrecise.format(rupees);
  return inr.format(Math.round(rupees));
}

export function rupeesToPaise(rupees: number) {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number) {
  return Math.round(paise) / 100;
}

export function discountPercent(mrp: number, price: number) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function formatStorage(gb: number) {
  if (gb >= 1024) {
    const tb = gb / 1024;
    return `${Number.isInteger(tb) ? tb : tb.toFixed(1)}TB`;
  }
  return `${gb}GB`;
}

export function formatDisplaySize(inches: number) {
  return `${Number.isInteger(inches) ? inches : inches.toFixed(1)}"`;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(value: Date | string) {
  return dateFmt.format(typeof value === "string" ? new Date(value) : value);
}

export function formatDateTime(value: Date | string) {
  return dateTimeFmt.format(typeof value === "string" ? new Date(value) : value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

/** Compact currency for dashboards, e.g. ₹12.4L, ₹1.2Cr */
export function formatCompactPrice(paise: number) {
  const rupees = paise / 100;
  if (rupees >= 1_00_00_000) return `₹${(rupees / 1_00_00_000).toFixed(1)}Cr`;
  if (rupees >= 1_00_000) return `₹${(rupees / 1_00_000).toFixed(1)}L`;
  if (rupees >= 1_000) return `₹${(rupees / 1_000).toFixed(1)}K`;
  return inr.format(rupees);
}
