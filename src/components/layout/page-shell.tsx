import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; path: string };

/** Visible breadcrumb trail + BreadcrumbList structured data. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("scrollbar-none overflow-x-auto", className)}>
        <ol className="flex items-center gap-1 text-[13px] whitespace-nowrap text-muted">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.path} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 text-faint" aria-hidden />}
                {last ? (
                  <span aria-current="page" className="max-w-[60vw] truncate text-foreground/80">
                    {c.name}
                  </span>
                ) : (
                  <Link href={c.path} className="hover:text-foreground">
                    {c.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(all)} />
    </>
  );
}

/** Standard page header used by content, account and listing pages. */
export function PageHeader({
  title,
  description,
  crumbs,
  eyebrow,
  children,
  className,
}: {
  title: string;
  description?: string | null;
  crumbs?: Crumb[];
  eyebrow?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-border bg-surface", className)}>
      <div className="container-page py-8 sm:py-10">
        {crumbs && <Breadcrumbs items={crumbs} className="mb-5" />}
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted text-pretty sm:text-base">{description}</p>}
        {children}
      </div>
    </div>
  );
}
