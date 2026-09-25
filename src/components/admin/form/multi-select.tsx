"use client";

import { useId, useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/primitives";
import type { Option } from "@/server/admin/types";

/**
 * Searchable checkbox list bound to a string[] form field. Selected values are
 * listed as removable chips above the list.
 */
export function MultiSelectField({
  name,
  label,
  options,
  hint,
  searchPlaceholder = "Filter…",
}: {
  name: string;
  label: string;
  options: readonly Option[];
  hint?: string;
  searchPlaceholder?: string;
}) {
  const { control } = useFormContext();
  const [query, setQuery] = useState("");
  const uid = useId();
  const labels = useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const selected = (field.value as string[] | undefined) ?? [];
        const toggle = (value: string, on: boolean) =>
          field.onChange(on ? [...selected, value] : selected.filter((v) => v !== value));
        return (
          <div role="group" aria-labelledby={`${uid}-label`} className="flex min-w-0 flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <p id={`${uid}-label`} className="text-sm font-medium">
                {label}
              </p>
              <span className="num text-xs text-muted">{selected.length} selected</span>
            </div>
            {hint && <p className="-mt-1 text-[13px] text-muted">{hint}</p>}
            {selected.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label={`Selected ${label.toLowerCase()}`}>
                {selected.map((v) => (
                  <li key={v}>
                    <button
                      type="button"
                      onClick={() => toggle(v, false)}
                      className="inline-flex max-w-full items-center gap-1 rounded-md bg-subtle px-2 py-1 text-xs hover:bg-stage"
                      aria-label={`Remove ${labels.get(v) ?? v}`}
                    >
                      <span className="max-w-56 truncate">{labels.get(v) ?? "Unknown"}</span>
                      <X className="size-3" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label htmlFor={`${uid}-q`} className="sr-only">
              Filter {label.toLowerCase()}
            </label>
            <Input
              id={`${uid}-q`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
            />
            <ul className="max-h-56 overflow-y-auto rounded-lg border border-border p-1">
              {visible.length === 0 && <li className="px-2 py-3 text-center text-sm text-muted">No matches</li>}
              {visible.map((o) => {
                const id = `${uid}-${o.value}`;
                const checked = selected.includes(o.value);
                return (
                  <li key={o.value}>
                    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-subtle">
                      <Checkbox id={id} checked={checked} onCheckedChange={(c) => toggle(o.value, c === true)} />
                      <span className="min-w-0 truncate">{o.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }}
    />
  );
}
