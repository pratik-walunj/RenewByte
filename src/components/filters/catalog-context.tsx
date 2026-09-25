"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { filtersToSearchParams, parseFilters, type CatalogFilters } from "@/lib/filters";
import { cn } from "@/lib/utils";

type Ctx = {
  filters: CatalogFilters;
  /** Filters fixed by the page (e.g. brand on /brand/dell) — hidden from the UI. */
  locked: Partial<Record<"brand" | "category" | "deal" | "price", boolean>>;
  isPending: boolean;
  update: (patch: Partial<CatalogFilters>) => void;
  toggle: <K extends "brand" | "category" | "processor" | "gen" | "screen" | "os">(key: K, value: string) => void;
  toggleNumber: (key: "ram" | "storage", value: number) => void;
  toggleGrade: (grade: CatalogFilters["condition"][number]) => void;
  clearAll: () => void;
};

const CatalogContext = React.createContext<Ctx | null>(null);

export function CatalogProvider({ locked = {}, children }: { locked?: Ctx["locked"]; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  const filters = React.useMemo(() => parseFilters(new URLSearchParams(params.toString())), [params]);

  const push = React.useCallback(
    (next: CatalogFilters) => {
      const qs = filtersToSearchParams(next).toString();
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router],
  );

  const value = React.useMemo<Ctx>(() => {
    const update = (patch: Partial<CatalogFilters>) => push({ ...filters, page: 1, ...patch });
    return {
      filters,
      locked,
      isPending,
      update,
      toggle: (key, v) => {
        const list = filters[key] as string[];
        update({ [key]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] } as Partial<CatalogFilters>);
      },
      toggleNumber: (key, v) => {
        const list = filters[key];
        update({ [key]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] } as Partial<CatalogFilters>);
      },
      toggleGrade: (g) => {
        const list = filters.condition;
        update({ condition: list.includes(g) ? list.filter((x) => x !== g) : [...list, g] });
      },
      clearAll: () => push({ ...parseFilters(new URLSearchParams()), q: filters.q, sort: filters.sort }),
    };
  }, [filters, locked, isPending, push]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = React.useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}

/** Dims server-rendered results while a filter navigation is in flight. */
export function ResultsRegion({ children }: { children: React.ReactNode }) {
  const { isPending } = useCatalog();
  return (
    <div
      aria-busy={isPending}
      className={cn("transition-opacity duration-150", isPending && "pointer-events-none opacity-50")}
    >
      {children}
    </div>
  );
}
