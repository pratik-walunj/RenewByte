import type { StockState } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StockStatus({
  state,
  available,
  className,
}: {
  state: StockState;
  available: number;
  className?: string;
}) {
  const map = {
    in: { dot: "bg-success-bright", text: "text-success", label: "In stock" },
    low: { dot: "bg-warning-bright", text: "text-warning", label: available === 1 ? "Only 1 left" : `Only ${available} left` },
    out: { dot: "bg-faint", text: "text-muted", label: "Out of stock" },
  }[state];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12.5px] font-medium", map.text, className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", map.dot)} />
      {map.label}
    </span>
  );
}
