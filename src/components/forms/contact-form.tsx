"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitContact } from "@/app/actions/content";
import { CONTACT_SUBJECTS, contactSchema, type ContactInput } from "@/components/forms/schemas";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Honeypot, applyServerErrors } from "@/components/forms/form-utils";

const DEFAULTS: ContactInput = { name: "", email: "", phone: "", subject: "" as ContactInput["subject"], message: "", website: "" };

export function ContactForm() {
  const [sent, setSent] = React.useState(false);
  const form = useForm<ContactInput>({ resolver: zodResolver(contactSchema), defaultValues: DEFAULTS });
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async (values) => {
    const res = await submitContact(values);
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
        <h3 className="mt-4 text-lg font-semibold tracking-tight">Message sent — thank you</h3>
        <p className="mt-1.5 text-[15px] text-muted text-pretty">
          We usually reply within one business day. For anything urgent, WhatsApp or call us during business hours.
        </p>
        <Button variant="outline" size="sm" className="mt-5" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  const err = (k: keyof ContactInput) => errors[k]?.message;
  const aria = (k: keyof ContactInput) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `contact-${k}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" htmlFor="contact-name" error={err("name")}>
        <Input id="contact-name" autoComplete="name" {...aria("name")} {...register("name")} />
      </Field>
      <Field label="Email" htmlFor="contact-email" error={err("email")}>
        <Input id="contact-email" type="email" autoComplete="email" inputMode="email" {...aria("email")} {...register("email")} />
      </Field>
      <Field label="Phone" htmlFor="contact-phone" optional error={err("phone")}>
        <Input id="contact-phone" type="tel" autoComplete="tel" inputMode="tel" {...aria("phone")} {...register("phone")} />
      </Field>
      <Field label="Topic" htmlFor="contact-subject" error={err("subject")}>
        <NativeSelect id="contact-subject" {...aria("subject")} {...register("subject")}>
          <option value="" disabled>
            Choose a topic
          </option>
          {CONTACT_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Message" htmlFor="contact-message" error={err("message")} className="sm:col-span-2" hint="Include your order number if your question is about an order.">
        <Textarea id="contact-message" rows={5} {...aria("message")} {...register("message")} />
      </Field>
      <Honeypot id="contact-website" {...register("website")} />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? "Sending…" : "Send message"}
        </Button>
        <p className="text-[13px] text-muted">We only use your details to reply to you.</p>
      </div>
    </form>
  );
}
