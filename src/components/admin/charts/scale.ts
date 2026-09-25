import { formatCompactPrice, formatNumber, formatPrice } from "@/lib/format";

export type ValueFormat = "currency" | "number";

/** Ticks and domain rounded to clean numbers (0 / 5K / 10K …). */
export function niceScale(max: number, count = 4) {
  if (max <= 0) return { max: count, ticks: Array.from({ length: count + 1 }, (_, i) => i) };
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  return { max: top, ticks };
}

export function formatTick(value: number, format: ValueFormat) {
  return format === "currency" ? formatCompactPrice(value) : formatNumber(Math.round(value));
}

export function formatValue(value: number, format: ValueFormat) {
  return format === "currency" ? formatPrice(value) : formatNumber(value);
}

export const CHART_ACCENT = "#2563eb";
export const CHART_GRID = "#e2e8f0";
export const CHART_AXIS = "#64748b";
