import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PageInfo, SearchParams } from "@/server/admin/pagination";

function hrefFor(basePath: string, sp: SearchParams, page: number) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const value = Array.isArray(v) ? v[0] : v;
    if (value && k !== "page") params.set(k, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function AdminPagination({
  info,
  basePath,
  searchParams,
  noun = "results",
}: {
  info: PageInfo;
  basePath: string;
  searchParams: SearchParams;
  noun?: string;
}) {
  const from = info.total === 0 ? 0 : (info.page - 1) * info.size + 1;
  const to = Math.min(info.total, info.page * info.size);
  const link = "inline-flex h-9 items-center gap-1 rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-subtle";
  const disabled = "pointer-events-none opacity-40";
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="num text-sm text-muted">
        {formatNumber(from)}–{formatNumber(to)} of {formatNumber(info.total)} {noun}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={hrefFor(basePath, searchParams, info.page - 1)}
          aria-disabled={info.page <= 1}
          tabIndex={info.page <= 1 ? -1 : undefined}
          className={cn(link, info.page <= 1 && disabled)}
        >
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </Link>
        <span className="num text-sm text-muted">
          {info.page} / {info.pages}
        </span>
        <Link
          href={hrefFor(basePath, searchParams, info.page + 1)}
          aria-disabled={info.page >= info.pages}
          tabIndex={info.page >= info.pages ? -1 : undefined}
          className={cn(link, info.page >= info.pages && disabled)}
        >
          Next <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
