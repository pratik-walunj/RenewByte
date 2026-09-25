"use client";

import * as React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CONDITION_GRADES, GRADE_LABEL } from "@/lib/constants";
import { countActiveFilters, OS_FAMILIES, SCREEN_BUCKETS, SORT_OPTIONS, type SortValue } from "@/lib/filters";
import { formatStorage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/dialog";
import { useCatalog } from "@/components/filters/catalog-context";
import { FilterPanel } from "@/components/filters/filter-panel";
import type { Facets } from "@/server/catalog";

export function SortSelect() {
  const { filters, update } = useCatalog();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="hidden text-sm text-muted sm:block">
        Sort by
      </label>
      <NativeSelect
        id="sort"
        value={filters.sort}
        onChange={(e) => update({ sort: e.target.value as SortValue })}
        className="h-10 w-auto min-w-40 text-sm sm:h-10"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

export function MobileFilters({ facets, total }: { facets: Facets; total: number }) {
  const { filters, clearAll, isPending } = useCatalog();
  const [open, setOpen] = React.useState(false);
  const active = countActiveFilters(filters);
  return (
    <>
      <Button variant="outline" className="h-10 lg:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal /> Filters
        {active > 0 && (
          <span className="num flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-white">{active}</span>
        )}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[88dvh]">
          <div className="flex items-center justify-between border-b border-border px-5 pt-2 pb-3">
            <SheetTitle className="text-base">Filters</SheetTitle>
            <SheetDescription className="sr-only">Narrow down laptops</SheetDescription>
            {active > 0 && (
              <button type="button" onClick={clearAll} className="mr-10 text-sm font-medium text-accent">
                Clear all
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-5">
            <FilterPanel facets={facets} />
          </div>
          <div className="border-t border-border p-4">
            <Button size="lg" className="w-full" onClick={() => setOpen(false)} disabled={isPending}>
              {isPending ? "Updating…" : `Show ${total} ${total === 1 ? "laptop" : "laptops"}`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function ActiveFilterChips({ facets }: { facets: Facets }) {
  const { filters, locked, update, toggle, toggleNumber, toggleGrade, clearAll } = useCatalog();
  const chips: { key: string; label: string; remove: () => void }[] = [];
  const label = (list: { slug: string; label: string }[], slug: string) => list.find((x) => x.slug === slug)?.label ?? slug;

  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, remove: () => update({ q: undefined }) });
  if (!locked.brand) filters.brand.forEach((b) => chips.push({ key: `b${b}`, label: label(facets.brands, b), remove: () => toggle("brand", b) }));
  if (!locked.category)
    filters.category.forEach((c) => chips.push({ key: `c${c}`, label: label(facets.categories, c), remove: () => toggle("category", c) }));
  if (filters.min !== undefined || filters.max !== undefined) {
    const txt =
      filters.min !== undefined && filters.max !== undefined
        ? `₹${filters.min.toLocaleString("en-IN")} – ₹${filters.max.toLocaleString("en-IN")}`
        : filters.min !== undefined
          ? `Over ₹${filters.min.toLocaleString("en-IN")}`
          : `Under ₹${filters.max!.toLocaleString("en-IN")}`;
    chips.push({ key: "price", label: txt, remove: () => update({ min: undefined, max: undefined }) });
  }
  filters.processor.forEach((p) => chips.push({ key: `p${p}`, label: label(facets.processors, p), remove: () => toggle("processor", p) }));
  filters.gen.forEach((g) => chips.push({ key: `g${g}`, label: label(facets.generations, g), remove: () => toggle("gen", g) }));
  filters.ram.forEach((r) => chips.push({ key: `r${r}`, label: `${r}GB RAM`, remove: () => toggleNumber("ram", r) }));
  filters.storage.forEach((s) => chips.push({ key: `s${s}`, label: `${formatStorage(s)} storage`, remove: () => toggleNumber("storage", s) }));
  if (filters.ssd) chips.push({ key: "ssd", label: "SSD only", remove: () => update({ ssd: false }) });
  filters.screen.forEach((s) =>
    chips.push({ key: `sc${s}`, label: SCREEN_BUCKETS.find((b) => b.slug === s)?.label ?? s, remove: () => toggle("screen", s) }),
  );
  if (filters.gpu) chips.push({ key: "gpu", label: filters.gpu === "dedicated" ? "Dedicated GPU" : "Integrated GPU", remove: () => update({ gpu: undefined }) });
  filters.os.forEach((o) => chips.push({ key: `o${o}`, label: OS_FAMILIES.find((x) => x.slug === o)?.label ?? o, remove: () => toggle("os", o) }));
  CONDITION_GRADES.filter((g) => filters.condition.includes(g)).forEach((g) =>
    chips.push({ key: `gr${g}`, label: GRADE_LABEL[g], remove: () => toggleGrade(g) }),
  );
  if (filters.warranty) chips.push({ key: "w", label: `${filters.warranty}+ months warranty`, remove: () => update({ warranty: undefined }) });
  if (filters.inStock) chips.push({ key: "stock", label: "In stock", remove: () => update({ inStock: false }) });
  if (filters.deal && !locked.deal) chips.push({ key: "deal", label: "Deals", remove: () => update({ deal: false }) });

  if (!chips.length) return null;
  return (
    <ul className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((c) => (
        <li key={c.key}>
          <button
            type="button"
            onClick={c.remove}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border-strong bg-surface pr-2 pl-3 text-[13px] hover:border-foreground/40"
            aria-label={`Remove filter ${c.label}`}
          >
            {c.label}
            <X className="size-3.5 text-muted" aria-hidden />
          </button>
        </li>
      ))}
      <li>
        <button type="button" onClick={clearAll} className="ml-1 text-[13px] font-medium text-accent hover:underline">
          Clear all
        </button>
      </li>
    </ul>
  );
}
