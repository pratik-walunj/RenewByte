"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductCardData } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";

/** Horizontally scrolling product row with snap points and desktop arrows. */
export function ProductRail({ products, label, tone = "light" }: { products: ProductCardData[]; label: string; tone?: "light" | "dark" }) {
  const ref = React.useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  const arrow = cn(
    "hidden size-10 items-center justify-center rounded-full border transition-colors md:inline-flex",
    tone === "dark" ? "border-white/20 text-white hover:bg-white/10" : "border-border-strong bg-surface hover:bg-subtle",
  );
  return (
    <div>
      <div className="mb-4 hidden justify-end gap-2 md:flex">
        <button type="button" className={arrow} onClick={() => scroll(-1)} aria-label={`Scroll ${label} left`}>
          <ChevronLeft className="size-4" />
        </button>
        <button type="button" className={arrow} onClick={() => scroll(1)} aria-label={`Scroll ${label} right`}>
          <ChevronRight className="size-4" />
        </button>
      </div>
      <ul
        ref={ref}
        aria-label={label}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:gap-4 sm:px-6 lg:mx-0 lg:px-0"
      >
        {products.map((p) => (
          <li key={p.id} className="w-[calc(50%-6px)] min-w-[168px] shrink-0 snap-start sm:w-[calc(33.333%-11px)] xl:w-[calc(25%-12px)]">
            <ProductCard product={p} className="text-foreground" />
          </li>
        ))}
      </ul>
    </div>
  );
}
