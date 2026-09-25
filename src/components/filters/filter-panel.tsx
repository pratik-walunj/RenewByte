"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { CONDITION_GRADES, GRADE_LABEL } from "@/lib/constants";
import { OS_FAMILIES, SCREEN_BUCKETS, WARRANTY_OPTIONS } from "@/lib/filters";
import { formatStorage } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/components/filters/catalog-context";
import type { Facets } from "@/server/catalog";

function Group({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const id = React.useId();
  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between text-left text-sm font-semibold"
      >
        {title}
        <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <div id={id} hidden={!open} className="pt-3">
        {children}
      </div>
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: React.ReactNode;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  const id = React.useId();
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <label htmlFor={id} className="flex flex-1 cursor-pointer items-center justify-between gap-2 text-[13.5px]">
        <span className="min-w-0 truncate">{label}</span>
        {count !== undefined && <span className="num text-xs text-faint">{count}</span>}
      </label>
    </div>
  );
}

function ShowMore<T>({ items, render, limit = 6 }: { items: T[]; render: (item: T) => React.ReactNode; limit?: number }) {
  const [all, setAll] = React.useState(false);
  const shown = all ? items : items.slice(0, limit);
  return (
    <>
      {shown.map(render)}
      {items.length > limit && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-1 text-[13px] font-medium text-accent hover:underline">
          {all ? "Show less" : `Show all ${items.length}`}
        </button>
      )}
    </>
  );
}

const PRICE_PRESETS = [
  { label: "Under ₹20k", min: undefined, max: 20000 },
  { label: "₹20k – 30k", min: 20000, max: 30000 },
  { label: "₹30k – 50k", min: 30000, max: 50000 },
  { label: "₹50k +", min: 50000, max: undefined },
];

function PriceFilter() {
  const { filters, update } = useCatalog();
  const [min, setMin] = React.useState(filters.min?.toString() ?? "");
  const [max, setMax] = React.useState(filters.max?.toString() ?? "");
  const [synced, setSynced] = React.useState({ min: filters.min, max: filters.max });

  // Keep inputs in sync when the URL changes elsewhere (chips, clear all).
  if (synced.min !== filters.min || synced.max !== filters.max) {
    setSynced({ min: filters.min, max: filters.max });
    setMin(filters.min?.toString() ?? "");
    setMax(filters.max?.toString() ?? "");
  }

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const lo = min ? Math.max(0, Number.parseInt(min, 10)) : undefined;
    const hi = max ? Math.max(0, Number.parseInt(max, 10)) : undefined;
    update({ min: Number.isFinite(lo) ? lo : undefined, max: Number.isFinite(hi) ? hi : undefined });
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PRICE_PRESETS.map((p) => {
          const active = filters.min === p.min && filters.max === p.max;
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={active}
              onClick={() => update(active ? { min: undefined, max: undefined } : { min: p.min, max: p.max })}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active ? "border-foreground bg-primary text-white" : "border-border-strong hover:border-foreground/40",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <form onSubmit={apply} className="flex items-end gap-2">
        <label className="flex-1 text-xs text-muted">
          Min (₹)
          <Input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} className="mt-1 h-9" placeholder="0" />
        </label>
        <label className="flex-1 text-xs text-muted">
          Max (₹)
          <Input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} className="mt-1 h-9" placeholder="Any" />
        </label>
        <Button type="submit" size="sm" variant="outline" className="h-9">
          Go
        </Button>
      </form>
    </div>
  );
}

export function FilterPanel({ facets }: { facets: Facets }) {
  const { filters, locked, toggle, toggleNumber, toggleGrade, update } = useCatalog();

  return (
    <div className="text-foreground">
      <Group title="Availability">
        <CheckRow label="In stock only" checked={filters.inStock} onChange={() => update({ inStock: !filters.inStock })} />
        {!locked.deal && <CheckRow label="Deals only" checked={filters.deal} onChange={() => update({ deal: !filters.deal })} />}
      </Group>

      {!locked.brand && facets.brands.length > 0 && (
        <Group title="Brand">
          <ShowMore
            items={facets.brands}
            render={(b) => (
              <CheckRow key={b.slug} label={b.label} count={b.count} checked={filters.brand.includes(b.slug)} onChange={() => toggle("brand", b.slug)} />
            )}
          />
        </Group>
      )}

      {!locked.price && (
        <Group title="Price">
          <PriceFilter />
        </Group>
      )}

      <Group title="Condition">
        {CONDITION_GRADES.map((g) => (
          <CheckRow key={g} label={GRADE_LABEL[g]} checked={filters.condition.includes(g)} onChange={() => toggleGrade(g)} />
        ))}
      </Group>

      {facets.processors.length > 0 && (
        <Group title="Processor">
          <ShowMore
            items={facets.processors}
            render={(p) => (
              <CheckRow key={p.slug} label={p.label} count={p.count} checked={filters.processor.includes(p.slug)} onChange={() => toggle("processor", p.slug)} />
            )}
          />
        </Group>
      )}

      {facets.generations.length > 0 && (
        <Group title="Processor generation" defaultOpen={false}>
          <ShowMore
            items={facets.generations}
            render={(g) => (
              <CheckRow key={g.slug} label={g.label} count={g.count} checked={filters.gen.includes(g.slug)} onChange={() => toggle("gen", g.slug)} />
            )}
          />
        </Group>
      )}

      {facets.ram.length > 0 && (
        <Group title="RAM">
          <div className="grid grid-cols-2 gap-x-2">
            {facets.ram.map((r) => (
              <CheckRow key={r.value} label={`${r.value}GB`} count={r.count} checked={filters.ram.includes(r.value)} onChange={() => toggleNumber("ram", r.value)} />
            ))}
          </div>
        </Group>
      )}

      {facets.storage.length > 0 && (
        <Group title="Storage">
          <div className="grid grid-cols-2 gap-x-2">
            {facets.storage.map((s) => (
              <CheckRow key={s.value} label={formatStorage(s.value)} count={s.count} checked={filters.storage.includes(s.value)} onChange={() => toggleNumber("storage", s.value)} />
            ))}
          </div>
          <div className="mt-2 border-t border-border pt-2">
            <CheckRow label="SSD only" checked={filters.ssd} onChange={() => update({ ssd: !filters.ssd })} />
          </div>
        </Group>
      )}

      <Group title="Screen size" defaultOpen={false}>
        {SCREEN_BUCKETS.map((b) => (
          <CheckRow key={b.slug} label={b.label} checked={filters.screen.includes(b.slug)} onChange={() => toggle("screen", b.slug)} />
        ))}
      </Group>

      <Group title="Graphics" defaultOpen={false}>
        <CheckRow label="Integrated" checked={filters.gpu === "integrated"} onChange={() => update({ gpu: filters.gpu === "integrated" ? undefined : "integrated" })} />
        <CheckRow label="Dedicated GPU" checked={filters.gpu === "dedicated"} onChange={() => update({ gpu: filters.gpu === "dedicated" ? undefined : "dedicated" })} />
      </Group>

      <Group title="Operating system" defaultOpen={false}>
        {OS_FAMILIES.map((o) => (
          <CheckRow key={o.slug} label={o.label} checked={filters.os.includes(o.slug)} onChange={() => toggle("os", o.slug)} />
        ))}
      </Group>

      <Group title="Warranty" defaultOpen={false}>
        {WARRANTY_OPTIONS.map((w) => (
          <CheckRow
            key={w.value}
            label={w.label}
            checked={filters.warranty === w.value}
            onChange={() => update({ warranty: filters.warranty === w.value ? undefined : w.value })}
          />
        ))}
      </Group>

      {!locked.category && facets.categories.length > 0 && (
        <Group title="Use" defaultOpen={false}>
          {facets.categories.map((c) => (
            <CheckRow key={c.slug} label={c.label} count={c.count} checked={filters.category.includes(c.slug)} onChange={() => toggle("category", c.slug)} />
          ))}
        </Group>
      )}
    </div>
  );
}
