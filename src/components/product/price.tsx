import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Price({
  price,
  mrp,
  size = "md",
  showSave = true,
  className,
}: {
  price: number;
  mrp: number;
  size?: "sm" | "md" | "lg";
  showSave?: boolean;
  className?: string;
}) {
  const saving = mrp > price ? mrp - price : 0;
  const pct = mrp > price ? Math.round((saving / mrp) * 100) : 0;
  return (
    <div className={cn("num", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground",
            size === "sm" && "text-base",
            size === "md" && "text-lg sm:text-xl",
            size === "lg" && "text-3xl sm:text-[34px]",
          )}
        >
          {formatPrice(price)}
        </span>
        {saving > 0 && (
          <span className={cn("text-muted line-through", size === "lg" ? "text-base" : "text-[13px]")}>
            <span className="sr-only">Original price </span>
            {formatPrice(mrp)}
          </span>
        )}
        {pct > 0 && size === "lg" && (
          <span className="rounded-md bg-sale-soft px-1.5 py-0.5 text-sm font-semibold text-sale">{pct}% off</span>
        )}
      </div>
      {showSave && saving > 0 && (
        <p className={cn("font-medium text-success", size === "lg" ? "mt-1 text-sm" : "text-[12.5px]")}>
          Save {formatPrice(saving)}
          {size !== "lg" && <span className="text-success/80"> · {pct}% off</span>}
        </p>
      )}
    </div>
  );
}
