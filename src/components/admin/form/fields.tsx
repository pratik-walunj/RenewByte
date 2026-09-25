"use client";

import * as React from "react";
import { Controller, get, useFormContext, useWatch } from "react-hook-form";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * react-hook-form bound fields. They read the form from context, so section
 * components stay small. Error messages are wired to inputs via `Field`.
 */

function useFieldError(name: string): string | undefined {
  const {
    formState: { errors },
  } = useFormContext();
  const err = get(errors, name);
  return typeof err?.message === "string" ? err.message : undefined;
}

const fieldId = (name: string) => `f-${name.replace(/\./g, "-")}`;

type Common = { name: string; label: string; hint?: string; optional?: boolean; className?: string };

export function TextField({
  name,
  label,
  hint,
  optional,
  className,
  onValueChange,
  ...input
}: Common & Omit<React.ComponentProps<"input">, "name"> & { onValueChange?: (value: string) => void }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} optional={optional} className={className}>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...input}
        {...register(name, { onChange: onValueChange ? (e) => onValueChange(e.target.value) : undefined })}
      />
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  optional,
  className,
  rows = 4,
  maxLength,
}: Common & { rows?: number; maxLength?: number }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  const id = fieldId(name);
  const value = (useWatch({ name }) as string | undefined) ?? "";
  return (
    <Field
      label={label}
      htmlFor={id}
      error={error}
      hint={maxLength ? `${hint ? `${hint} · ` : ""}${value.length}/${maxLength}` : hint}
      optional={optional}
      className={className}
    >
      <Textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-0"
        {...register(name)}
      />
    </Field>
  );
}

/** Number input. Empty becomes `null` when `nullable`, otherwise NaN (which the schema rejects with a message). */
export function NumberField({
  name,
  label,
  hint,
  optional,
  className,
  nullable,
  step = "1",
  min,
  max,
  suffix,
}: Common & { nullable?: boolean; step?: string; min?: number; max?: number; suffix?: string }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} optional={optional} className={className}>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn("num", suffix && "pr-12")}
          {...register(name, {
            setValueAs: (v: unknown) =>
              v === "" || v === null || v === undefined ? (nullable ? null : Number.NaN) : Number(v),
          })}
        />
        {suffix && (
          <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}

export function SelectField({
  name,
  label,
  hint,
  optional,
  className,
  options,
  placeholder,
}: Common & { options: readonly { value: string; label: string }[]; placeholder?: string }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} optional={optional} className={className}>
      <NativeSelect
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...register(name)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}

export function CheckboxField({ name, label, hint, className }: Omit<Common, "optional">) {
  const { control } = useFormContext();
  const id = fieldId(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={cn("flex items-start gap-3", className)}>
          <Checkbox
            id={id}
            checked={Boolean(field.value)}
            onCheckedChange={(c) => field.onChange(c === true)}
            onBlur={field.onBlur}
            ref={field.ref}
            className="mt-0.5"
            aria-describedby={hint ? `${id}-hint` : undefined}
          />
          <div className="min-w-0">
            <label htmlFor={id} className="text-sm font-medium">
              {label}
            </label>
            {hint && (
              <p id={`${id}-hint`} className="text-[13px] text-muted">
                {hint}
              </p>
            )}
          </div>
        </div>
      )}
    />
  );
}

/** Error for an array/root field (e.g. "images") that isn't tied to one input. */
export function RootError({ name }: { name: string }) {
  const {
    formState: { errors },
  } = useFormContext();
  const err = get(errors, name);
  const message = err?.message ?? err?.root?.message;
  if (typeof message !== "string") return null;
  return (
    <p role="alert" className="text-[13px] text-sale">
      {message}
    </p>
  );
}

/** A titled block within a long form, addressable by anchor. */
export function FormSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-20 rounded-xl border border-border bg-surface", className)}>
      <div className="border-b border-border px-4 py-3.5 sm:px-5">
        <h2 id={`${id}-title`} className="text-[15px] font-semibold tracking-tight">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      <div className="flex flex-col gap-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  return <div className={cn("grid gap-4", cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>{children}</div>;
}
