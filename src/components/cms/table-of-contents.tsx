"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Sticky "On this page" list with scroll-spy. Headings come from `markdocHeadings`. */
export function TableOfContents({
  headings,
  className,
}: {
  headings: { id: string; text: string }[];
  className?: string;
}) {
  const [active, setActive] = React.useState<string | null>(null);

  React.useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page" className={cn("text-sm", className)}>
      <p className="eyebrow mb-3">On this page</p>
      <ol className="space-y-0.5 border-l border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-1.5 pr-2 pl-4 leading-snug transition-colors",
                active === h.id
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
