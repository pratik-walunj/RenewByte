"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { requestPasswordReset } from "@/app/actions/auth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { applyFieldErrors, FormAlert } from "@/components/auth/password-input";

export function ForgotPasswordForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await requestPasswordReset(values);
    if (!res.ok) {
      setError(res.error);
      applyFieldErrors(res.fieldErrors, setFieldError);
      return;
    }
    setSent(res.message);
  });

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start gap-4">
        <span className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
          <MailCheck className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-medium">Check your inbox</p>
          <p className="mt-1 text-sm text-muted text-pretty">{sent}</p>
          <p className="mt-2 text-sm text-muted">Don&apos;t see it? Check your spam folder or try again in a few minutes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/login">Back to sign in</Link>
          </Button>
          <Button variant="ghost" onClick={() => setSent(null)}>
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert message={error} />
      <Field label="Email" htmlFor="forgot-email" error={errors.email?.message}>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "forgot-email-error" : undefined}
          {...register("email")}
        />
      </Field>
      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {isSubmitting ? "Sending link…" : "Send reset link"}
      </Button>
    </form>
  );
}
