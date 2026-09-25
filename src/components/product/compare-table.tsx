"use client";

import * as React from "react";
import Link from "next/link";
import { GitCompareArrows, X } from "lucide-react";
import { fetchProductsBySlugs } from "@/app/actions/store";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Checkbox } from "@/components/ui/primitives";
import { GradeTag } from "@/components/product/grade";
import { Price } from "@/components/product/price";
import { ProductImage } from "@/components/product/product-image";
import { StockStatus } from "@/components/product/stock-status";
import { AddToCartButton } from "@/components/product/product-actions";
import { COMPARE_LIMIT, GRADE_LABEL, STORAGE_TYPE_LABEL } from "@/lib/constants";
import { formatPrice, formatStorage } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROWS: { label: string; value: (p: ProductCardData) => string }[] = [
  { label: "Price", value: (p) => formatPrice(p.price) },
  { label: "Processor", value: (p) => p.processor },
  { label: "Generation", value: (p) => p.processorGeneration ?? "—" },
  { label: "RAM", value: (p) => `${p.ramGb}GB` },
  { label: "Storage", value: (p) => `${formatStorage(p.storageGb)} ${STORAGE_TYPE_LABEL[p.storageType]}` },
  { label: "Display", value: (p) => `${p.displaySize}"${p.resolution ? ` · ${p.resolution}` : ""}` },
  { label: "Graphics", value: (p) => p.graphics },
  { label: "Battery health", value: (p) => (p.batteryHealth !== null ? `${p.batteryHealth}%` : "—") },
  { label: "Weight", value: (p) => (p.weightKg ? `${p.weightKg} kg` : "—") },
  { label: "Warranty", value: (p) => `${p.warrantyMonths} months` },
  { label: "Condition", value: (p) => GRADE_LABEL[p.conditionGrade] },
  { label: "Operating system", value: (p) => p.operatingSystem },
];

export function CompareTable() {
  const { compare, toggleCompare, clearCompare } = useStore();
  const [products, setProducts] = React.useState<ProductCardData[] | null>(null);
  const [diffOnly, setDiffOnly] = React.useState(false);
  const key = compare.join(",");

  React.useEffect(() => {
    let cancelled = false;
    const slugs = key ? key.split(",") : [];
    const load = slugs.length ? fetchProductsBySlugs(slugs) : Promise.resolve([] as ProductCardData[]);
    load.then((rows) => {
      if (!cancelled) setProducts(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (products === null) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4" role="status" aria-label="Loading comparison">
        {Array.from({ length: Math.max(compare.length, 2) }, (_, i) => (
          <div key={i} className="skeleton h-80" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<GitCompareArrows />}
        title="Nothing to compare yet"
        description={`Tick “Compare” on up to ${COMPARE_LIMIT} laptops to see their specs side by side.`}
      >
        <Button asChild>
          <Link href="/laptops">Browse laptops</Link>
        </Button>
      </EmptyState>
    );
  }

  const rows = diffOnly
    ? ROWS.filter((r) => new Set(products.map((p) => r.value(p))).size > 1)
    : ROWS;
  const best = (label: string) => {
    if (products.length < 2) return null;
    if (label === "Price") return Math.min(...products.map((p) => p.price));
    if (label === "RAM") return Math.max(...products.map((p) => p.ramGb));
    if (label === "Battery health") return Math.max(...products.map((p) => p.batteryHealth ?? 0));
    return null;
  };
  const isBest = (label: string, p: ProductCardData) => {
    const b = best(label);
    if (b === null) return false;
    if (label === "Price") return p.price === b;
    if (label === "RAM") return p.ramGb === b;
    if (label === "Battery health") return p.batteryHealth === b;
    return false;
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={diffOnly} onCheckedChange={(v) => setDiffOnly(v === true)} />
          Show differences only
        </label>
        <div className="flex gap-2">
          {products.length < COMPARE_LIMIT && (
            <Button asChild variant="outline" size="sm">
              <Link href="/laptops">Add another laptop</Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearCompare}>
            Clear all
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
          <caption className="sr-only">Laptop comparison</caption>
          <colgroup>
            <col className="w-32 sm:w-44" />
            {products.map((p) => (
              <col key={p.id} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-surface p-4 text-left align-bottom text-xs font-medium text-muted">
                {products.length} of {COMPARE_LIMIT}
              </th>
              {products.map((p) => (
                <th key={p.id} scope="col" className="border-l border-border p-4 text-left align-top font-normal">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleCompare(p.slug)}
                      className="absolute -top-1 -right-1 z-10 inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-subtle hover:text-foreground"
                      aria-label={`Remove ${p.name} from comparison`}
                    >
                      <X className="size-4" />
                    </button>
                    <Link href={`/laptops/${p.slug}`} className="block">
                      <span className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-stage">
                        <ProductImage src={p.image?.url} alt={p.image?.alt ?? p.name} fill sizes="240px" className="object-contain p-3" />
                      </span>
                      <span className="eyebrow mt-3 block">{p.brand.name}</span>
                      <span className="mt-1 line-clamp-2 block font-medium hover:text-accent">{p.name}</span>
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <GradeTag grade={p.conditionGrade} />
                      <StockStatus state={p.stock} available={p.available} />
                    </div>
                    <Price price={p.price} mrp={p.mrp} size="sm" className="mt-3" />
                    <AddToCartButton
                      product={{ id: p.id, name: p.name, brand: p.brand.name, price: p.price }}
                      disabled={p.stock === "out"}
                      size="sm"
                      className="mt-3 w-full"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-border">
                <th scope="row" className="sticky left-0 z-10 bg-surface p-4 text-left align-top text-[13px] font-medium text-muted">
                  {r.label}
                </th>
                {products.map((p) => (
                  <td
                    key={p.id}
                    className={cn("border-l border-border p-4 align-top", isBest(r.label, p) && "bg-success-soft font-semibold text-success")}
                  >
                    {r.value(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted sm:hidden">Scroll sideways to see every laptop →</p>
    </div>
  );
}
