"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { login } from "@/app/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { applyFieldErrors, FormAlert, PasswordInput } from "@/components/auth/password-input";

export function LoginForm({ next, notice }: { next?: string; notice?: string | null }) {
  const router = useRouter();
  const { refresh } = useStore();
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await login(values, next);
    if (!res.ok) {
      setError(res.error);
      applyFieldErrors(res.fieldErrors, setFieldError);
      return;
    }
    await refresh();
    router.replace(res.redirectTo);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert message={notice} tone="success" />
      <FormAlert message={error} />
      <Field label="Email" htmlFor="login-email" error={errors.email?.message}>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          {...register("email")}
        />
      </Field>
      <div className="flex flex-col gap-1.5">
        <Field label="Password" htmlFor="login-password" error={errors.password?.message}>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            {...register("password")}
          />
        </Field>
        <Link href="/forgot-password" className="self-end text-[13px] font-medium text-accent hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
