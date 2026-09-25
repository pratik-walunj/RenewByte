"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitTradeIn } from "@/app/actions/content";
import {
  AGE_OPTIONS,
  RAM_OPTIONS,
  STORAGE_OPTIONS,
  TRADE_IN_BRANDS,
  TRADE_IN_CONDITIONS,
  tradeInSchema,
  type TradeInInput,
} from "@/components/forms/schemas";
import { formatStorage } from "@/lib/format";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Honeypot, applyServerErrors } from "@/components/forms/form-utils";

const DEFAULTS: TradeInInput = {
  name: "",
  email: "",
  phone: "",
  city: "",
  brand: "" as TradeInInput["brand"],
  model: "",
  processor: "",
  ram: "",
  storage: "",
  age: "",
  condition: "",
  notes: "",
  website: "",
};

export function TradeInForm() {
  const [sent, setSent] = React.useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TradeInInput>({ resolver: zodResolver(tradeInSchema), defaultValues: DEFAULTS });

  const onSubmit = handleSubmit(async (values) => {
    const res = await submitTradeIn(values);
    if (!res.ok) {
      applyServerErrors(res.fieldErrors, setError);
      toast.error(res.error);
      return;
    }
    reset(DEFAULTS);
    setSent(true);
  });

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start rounded-xl border border-border bg-surface p-6 sm:p-8">
        <span className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">Request received</h3>
        <p className="mt-1.5 text-[15px] text-muted text-pretty">
          Thanks — our team will review the details and contact you with an estimated quote, usually within one to two
          business days.
        </p>
        <Button variant="outline" size="sm" className="mt-5" onClick={() => setSent(false)}>
          Submit another laptop
        </Button>
      </div>
    );
  }

  const err = (k: keyof TradeInInput) => errors[k]?.message;
  const field = (k: keyof TradeInInput) => ({
    id: `sell-${k}`,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `sell-${k}-error` : undefined,
    ...register(k),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="eyebrow mb-4">Your details</legend>
        <Field label="Name" htmlFor="sell-name" error={err("name")}>
          <Input autoComplete="name" {...field("name")} />
        </Field>
        <Field label="Phone" htmlFor="sell-phone" error={err("phone")}>
          <Input type="tel" inputMode="tel" autoComplete="tel" {...field("phone")} />
        </Field>
        <Field label="Email" htmlFor="sell-email" error={err("email")}>
          <Input type="email" inputMode="email" autoComplete="email" {...field("email")} />
        </Field>
        <Field label="City" htmlFor="sell-city" error={err("city")}>
          <Input autoComplete="address-level2" {...field("city")} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="eyebrow mb-4">Your laptop</legend>
        <Field label="Brand" htmlFor="sell-brand" error={err("brand")}>
          <NativeSelect {...field("brand")}>
            <option value="" disabled>
              Choose brand
            </option>
            {TRADE_IN_BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Model" htmlFor="sell-model" error={err("model")} hint="Usually printed under the laptop, e.g. ThinkPad T480.">
          <Input {...field("model")} />
        </Field>
        <Field label="Processor" htmlFor="sell-processor" optional error={err("processor")}>
          <Input placeholder="e.g. Intel Core i5-8350U" {...field("processor")} />
        </Field>
        <Field label="Age" htmlFor="sell-age" optional error={err("age")}>
          <NativeSelect {...field("age")}>
            <option value="">Not sure</option>
            {AGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="RAM" htmlFor="sell-ram" optional error={err("ram")}>
          <NativeSelect {...field("ram")}>
            <option value="">Not sure</option>
            {RAM_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r} GB
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Storage" htmlFor="sell-storage" optional error={err("storage")}>
          <NativeSelect {...field("storage")}>
            <option value="">Not sure</option>
            {STORAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {formatStorage(Number(s))}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Condition" htmlFor="sell-condition" error={err("condition")} className="sm:col-span-2">
          <NativeSelect {...field("condition")}>
            <option value="" disabled>
              Choose the closest description
            </option>
            {TRADE_IN_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          label="Anything else we should know?"
          htmlFor="sell-notes"
          optional
          error={err("notes")}
          className="sm:col-span-2"
          hint="Charger included? Any faults, repairs or missing keys? Battery backup?"
        >
          <Textarea rows={4} {...field("notes")} />
        </Field>
      </fieldset>

      <Honeypot id="sell-website" {...register("website")} />

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? "Submitting…" : "Get my quote"}
        </Button>
        <p className="text-[13px] text-muted">No obligation. Quotes are confirmed after physical inspection.</p>
      </div>
    </form>
  );
}
