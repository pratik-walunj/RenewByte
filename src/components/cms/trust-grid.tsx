import { cn } from "@/lib/utils";
import { CmsIcon } from "@/components/cms/icon";

export type TrustItem = { icon: string; title: string; description: string };

/** Grid of trust commitments (icon + title + description) from the CMS. */
export function TrustGrid({ items, className }: { items: readonly TrustItem[]; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={cn("grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item) => (
        <li key={item.title} className="flex gap-4 bg-surface p-5 sm:p-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-foreground">
            <CmsIcon name={item.icon} className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold tracking-tight">{item.title}</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-muted text-pretty">{item.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
