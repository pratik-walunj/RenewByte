"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { GRADE_SHORT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/product/product-image";
import type { SearchSuggestions } from "@/server/catalog";

const EMPTY: SearchSuggestions = { products: [], brands: [], categories: [] };

/** Accessible combobox with debounced autocomplete. */
export function SearchBox({
  className,
  autoFocus,
  onNavigate,
  inputClassName,
}: {
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
  inputClassName?: string;
}) {
  const router = useRouter();
  const id = React.useId();
  const listId = `${id}-list`;
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchSuggestions>(EMPTY);
  const [active, setActive] = React.useState(-1);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const options = React.useMemo(
    () => [
      ...results.products.map((p) => ({ key: `p-${p.slug}`, href: `/laptops/${p.slug}` })),
      ...results.brands.map((b) => ({ key: `b-${b.slug}`, href: `/brand/${b.slug}` })),
      ...results.categories.map((c) => ({ key: `c-${c.slug}`, href: `/category/${c.slug}` })),
    ],
    [results],
  );

  React.useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) setResults(await res.json());
      } catch {
        /* aborted */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (active >= 0 && options[active]) return go(options[active].href);
    const term = q.trim();
    if (!term) return;
    track({ name: "search", search_term: term });
    go(`/laptops?q=${encodeURIComponent(term)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) setOpen(true);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  const showPanel = open && q.trim().length >= 2;
  const hasResults = options.length > 0;
  const browse = [
    ...results.brands.map((b) => ({ ...b, href: `/brand/${b.slug}`, kind: "Brand" })),
    ...results.categories.map((c) => ({ ...c, href: `/category/${c.slug}`, kind: "Category" })),
  ];

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <form role="search" onSubmit={submit}>
        <label htmlFor={`${id}-input`} className="sr-only">
          Search laptops
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          enterKeyHint="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLoading(e.target.value.trim().length >= 2);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search laptops, brands, processors…"
          className={cn(
            "h-10 w-full rounded-full border border-border bg-subtle pr-10 pl-10 text-[15px] text-foreground outline-none placeholder:text-muted transition-colors focus:border-accent focus:bg-surface focus:ring-3 focus:ring-accent/15 sm:text-sm [&::-webkit-search-cancel-button]:hidden",
            inputClassName,
          )}
        />
        {loading ? (
          <Loader2 className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted" aria-hidden />
        ) : (
          q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQ("");
                inputRef.current?.focus();
              }}
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-border/60"
            >
              <X className="size-4" />
            </button>
          )
        )}
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[70dvh] overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-pop"
        >
          {!hasResults && !loading && (
            <p className="px-3 py-6 text-center text-sm text-muted">
              No matches for “{q.trim()}”. Press Enter to search all laptops.
            </p>
          )}
          {results.products.length > 0 && (
            <div>
              <p className="eyebrow px-3 pt-2 pb-1">Laptops</p>
              {results.products.map((p, i) => {
                return (
                  <Link
                    key={p.slug}
                    id={`${id}-opt-${i}`}
                    role="option"
                    aria-selected={active === i}
                    href={`/laptops/${p.slug}`}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-subtle",
                      active === i && "bg-subtle",
                    )}
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-stage">
                      <ProductImage src={p.image?.url} alt="" fill sizes="48px" className="object-contain p-1" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="block truncate font-mono text-[11.5px] text-muted">
                        {p.specs} · Grade {GRADE_SHORT[p.grade]}
                      </span>
                    </span>
                    <span className="num shrink-0 text-sm font-semibold">{formatPrice(p.price)}</span>
                  </Link>
                );
              })}
            </div>
          )}
          {(results.brands.length > 0 || results.categories.length > 0) && (
            <div className="mt-1 border-t border-border pt-1">
              <p className="eyebrow px-3 pt-2 pb-1">Browse</p>
              {browse.map((item, j) => {
                const i = results.products.length + j;
                return (
                  <Link
                    key={item.href}
                    id={`${id}-opt-${i}`}
                    role="option"
                    aria-selected={active === i}
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-subtle",
                      active === i && "bg-subtle",
                    )}
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-muted">{item.kind}</span>
                  </Link>
                );
              })}
            </div>
          )}
          {hasResults && (
            <button
              type="button"
              onClick={() => go(`/laptops?q=${encodeURIComponent(q.trim())}`)}
              className="mt-1 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-accent hover:bg-accent-soft"
            >
              See all results for “{q.trim()}” →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
