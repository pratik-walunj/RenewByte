import { formatValue, type ValueFormat } from "./scale";

/**
 * Ranked horizontal bars for a small categorical breakdown. Each row is text first
 * (name + value in text tokens) with a thin accent bar underneath, so it reads
 * without colour and is a plain list for assistive technology.
 */
export function BarList({
  items,
  format,
  label,
  empty = "No data for this period.",
}: {
  items: { label: string; value: number; note?: string }[];
  format: ValueFormat;
  label: string;
  empty?: string;
}) {
  if (!items.length) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ol aria-label={label} className="flex flex-col gap-3.5">
      {items.map((item) => (
        <li key={item.label} className="min-w-0">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium">{item.label}</span>
            <span className="num shrink-0 text-foreground">
              {formatValue(item.value, format)}
              {item.note && <span className="ml-1.5 text-xs text-muted">{item.note}</span>}
            </span>
          </div>
          <div aria-hidden className="mt-1.5 h-2 rounded-full bg-subtle">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
