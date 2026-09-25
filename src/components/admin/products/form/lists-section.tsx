"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection, RootError } from "@/components/admin/form/fields";

/** Editable ordered list of short strings, stored in the form as [{ value }]. */
function StringList({ name, label, placeholder, max }: { name: string; label: string; placeholder: string; max: number }) {
  const { control, register } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const headingId = `${name}-heading`;
  return (
    <div role="group" aria-labelledby={headingId} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p id={headingId} className="text-sm font-medium">
          {label} <span className="font-normal text-muted num">({fields.length})</span>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append({ value: "" }, { shouldFocus: true })}
          disabled={fields.length >= max}
        >
          <Plus /> Add
        </Button>
      </div>
      {fields.length === 0 && <p className="text-[13px] text-muted">None yet.</p>}
      <ol className="flex flex-col gap-2">
        {fields.map((field, i) => (
          <li key={field.id} className="flex min-w-0 items-center gap-1.5">
            <label htmlFor={`${name}-${i}`} className="sr-only">
              {label} {i + 1}
            </label>
            <Input id={`${name}-${i}`} placeholder={placeholder} className="min-w-0 flex-1" {...register(`${name}.${i}.value`)} />
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${label.toLowerCase()} ${i + 1} up`} disabled={i === 0} onClick={() => move(i, i - 1)}>
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Move ${label.toLowerCase()} ${i + 1} down`}
              disabled={i === fields.length - 1}
              onClick={() => move(i, i + 1)}
              className="hidden sm:inline-flex"
            >
              <ArrowDown />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} onClick={() => remove(i)}>
              <X />
            </Button>
          </li>
        ))}
      </ol>
      <RootError name={name} />
    </div>
  );
}

export function ListsSection() {
  return (
    <FormSection id="lists" title="Highlights & features" description="Short bullet points. Empty rows are ignored on save.">
      <StringList name="highlights" label="Highlights" placeholder="Business-class build, MIL-STD tested" max={12} />
      <div className="border-t border-border" />
      <StringList name="features" label="Features" placeholder="Fingerprint reader" max={30} />
      <div className="border-t border-border" />
      <StringList name="ports" label="Ports" placeholder="2 × USB-A 3.1" max={20} />
      <div className="border-t border-border" />
      <StringList name="whatsIncluded" label="What's included" placeholder="65W charger" max={12} />
    </FormSection>
  );
}

export function SpecRowsSection() {
  const { control, register } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name: "specifications" });
  return (
    <FormSection id="spec-rows" title="Extra specification rows" description="Anything not covered above, grouped on the product page.">
      {fields.length === 0 && <p className="text-[13px] text-muted">No extra rows.</p>}
      <ol className="flex flex-col gap-3">
        {fields.map((field, i) => (
          <li key={field.id} className="grid min-w-0 gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end sm:border-0 sm:p-0">
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor={`spec-${i}-group`} className="text-xs text-muted">Group</label>
              <Input id={`spec-${i}-group`} placeholder="General" {...register(`specifications.${i}.group`)} />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor={`spec-${i}-label`} className="text-xs text-muted">Label</label>
              <Input id={`spec-${i}-label`} placeholder="Webcam" {...register(`specifications.${i}.label`)} />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor={`spec-${i}-value`} className="text-xs text-muted">Value</label>
              <Input id={`spec-${i}-value`} placeholder="720p HD" {...register(`specifications.${i}.value`)} />
            </div>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move row ${i + 1} up`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove row ${i + 1}`} onClick={() => remove(i)}>
                <X />
              </Button>
            </div>
            <div className="sm:col-span-4">
              <RootError name={`specifications.${i}.label`} />
              <RootError name={`specifications.${i}.value`} />
            </div>
          </li>
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => append({ group: "General", label: "", value: "" }, { shouldFocus: true })}
        disabled={fields.length >= 60}
      >
        <Plus /> Add row
      </Button>
    </FormSection>
  );
}
