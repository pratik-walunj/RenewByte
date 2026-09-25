import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Page title block used at the top of every admin screen (the page's only h1). */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8">
      {back && (
        <Link href={back.href} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
          <h1 className="text-2xl font-semibold tracking-tight text-balance break-words sm:text-[28px]">{title}</h1>
          {description && <div className="mt-1.5 max-w-2xl text-[15px] text-muted text-pretty">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Bordered card with an optional heading row. */
export function Panel({
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
  id,
}: {
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  id?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section aria-labelledby={headingId} className={cn("min-w-0 rounded-xl border border-border bg-surface", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title && (
              <h2 id={headingId} className="text-[15px] font-semibold tracking-tight">
                {title}
              </h2>
            )}
            {description && <div className="mt-0.5 text-[13px] text-muted">{description}</div>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** GET filter form: submitting updates the URL so filters are shareable and work without JS. */
export function FilterBar({
  action,
  children,
  query,
  queryPlaceholder = "Search…",
  resetHref,
  hidden,
}: {
  action: string;
  children?: React.ReactNode;
  query?: string;
  queryPlaceholder?: string;
  resetHref?: string;
  hidden?: Record<string, string>;
}) {
  return (
    <form
      action={action}
      method="get"
      role="search"
      className="mb-4 flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      {hidden &&
        Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      {query !== undefined && (
        <div className="relative min-w-0 sm:min-w-56 sm:flex-1">
          <label htmlFor="admin-q" className="sr-only">
            Search
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input id="admin-q" name="q" type="search" defaultValue={query} placeholder={queryPlaceholder} className="pl-9" />
        </div>
      )}
      {children}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" className="flex-1 sm:flex-none">
          Apply
        </Button>
        {resetHref && (
          <Button asChild variant="ghost" className="flex-1 sm:flex-none">
            <Link href={resetHref}>Reset</Link>
          </Button>
        )}
      </div>
    </form>
  );
}

/** Compact labelled select for FilterBar. */
export function FilterSelect({
  name,
  label,
  value,
  options,
  allLabel = "All",
}: {
  name: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  allLabel?: string;
}) {
  const id = `filter-${name}`;
  return (
    <div className="flex min-w-0 flex-col gap-1 sm:w-44">
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={value}
          className="h-11 w-full appearance-none rounded-lg border border-border-strong bg-surface pr-8 pl-3 text-[15px] outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/15 sm:h-10 sm:text-sm"
        >
          <option value="">{allLabel}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ─── Tables (desktop) + cards (mobile) ──────────────────────

export const th = "px-4 py-3 text-left text-xs font-medium whitespace-nowrap text-muted";
export const td = "px-4 py-3 align-middle";

export function DataTable({ caption, children, className }: { caption: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("hidden overflow-x-auto rounded-xl border border-border bg-surface md:block", className)}>
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function CardList({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <ul aria-label={label} className="flex flex-col gap-2 md:hidden">
      {children}
    </ul>
  );
}

export function CardItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <li className={cn("min-w-0 rounded-xl border border-border bg-surface p-4", className)}>{children}</li>;
}

/** Key/value line used inside mobile cards and detail panels. */
export function Meta({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-baseline justify-between gap-3 text-sm", className)}>
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right break-words">{children}</dd>
    </div>
  );
}
