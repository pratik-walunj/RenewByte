import Link from "next/link";
import { SearchX } from "lucide-react";
import { filtersToSearchParams, type CatalogFilters } from "@/lib/filters";
import type { ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Facets } from "@/server/catalog";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { CatalogProvider, ResultsRegion } from "@/components/filters/catalog-context";
import { FilterPanel } from "@/components/filters/filter-panel";
import { ActiveFilterChips, MobileFilters, SortSelect } from "@/components/filters/catalog-toolbar";

type Result = { items: ProductCardData[]; total: number; page: number; pageCount: number };

function Pagination({ basePath, filters, page, pageCount }: { basePath: string; filters: CatalogFilters; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const qs = filtersToSearchParams({ ...filters, page: p }).toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );
  const cls = "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium";
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className={cn(cls, "border-border-strong bg-surface hover:bg-subtle")}>
          Previous
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              cls,
              "hidden sm:inline-flex",
              p === page ? "inline-flex border-primary bg-primary text-white" : "border-border-strong bg-surface hover:bg-subtle",
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link href={href(page + 1)} rel="next" className={cn(cls, "border-border-strong bg-surface hover:bg-subtle")}>
          Next
        </Link>
      )}
    </nav>
  );
}

/** Sidebar filters + toolbar + results grid, shared by every listing page. */
export function CatalogView({
  basePath,
  filters,
  facets,
  result,
  locked,
  emptyAction,
}: {
  basePath: string;
  filters: CatalogFilters;
  facets: Facets;
  result: Result;
  locked?: Partial<Record<"brand" | "category" | "deal" | "price", boolean>>;
  emptyAction?: { label: string; href: string };
}) {
  const from = (result.page - 1) * 24 + 1;
  const to = from + result.items.length - 1;
  return (
    <CatalogProvider locked={locked}>
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[260px_1fr] lg:py-10">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-32 max-h-[calc(100dvh-9rem)] overflow-y-auto pr-3">
            <h2 className="sr-only">Filters</h2>
            <FilterPanel facets={facets} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
              {result.total > 0 ? (
                <>
                  Showing <span className="num font-medium text-foreground">{from}–{to}</span> of{" "}
                  <span className="num font-medium text-foreground">{result.total}</span> laptops
                </>
              ) : (
                "No laptops found"
              )}
            </p>
            <div className="flex items-center gap-2">
              <MobileFilters facets={facets} total={result.total} />
              <SortSelect />
            </div>
          </div>
          <ActiveFilterChips facets={facets} />
          <ResultsRegion>
            {result.items.length > 0 ? (
              <>
                <ProductGrid products={result.items} priorityCount={4} />
                <Pagination basePath={basePath} filters={filters} page={result.page} pageCount={result.pageCount} />
              </>
            ) : (
              <EmptyState
                icon={<SearchX />}
                title="No laptops match these filters"
                description="Try removing a filter or widening your price range. New stock arrives every week."
              >
                <Button asChild variant="outline">
                  <Link href={basePath}>Clear filters</Link>
                </Button>
                {emptyAction && (
                  <Button asChild>
                    <Link href={emptyAction.href}>{emptyAction.label}</Link>
                  </Button>
                )}
              </EmptyState>
            )}
          </ResultsRegion>
        </div>
      </div>
    </CatalogProvider>
  );
}
