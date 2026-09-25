"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { register as registerAction } from "@/app/actions/auth";
import { PASSWORD_MIN, registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { applyFieldErrors, FormAlert, PasswordInput } from "@/components/auth/password-input";

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const { refresh } = useStore();
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await registerAction(values, next);
    if (!res.ok) {
      setError(res.error);
      applyFieldErrors(res.fieldErrors, setFieldError);
      return;
    }
    toast.success("Welcome to RenewByte — your account is ready.");
    await refresh();
    router.replace(res.redirectTo);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert message={error} />
      <Field label="Full name" htmlFor="register-name" error={errors.name?.message}>
        <Input
          id="register-name"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "register-name-error" : undefined}
          {...register("name")}
        />
      </Field>
      <Field label="Email" htmlFor="register-email" error={errors.email?.message}>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          {...register("email")}
        />
      </Field>
      <Field
        label="Password"
        htmlFor="register-password"
        error={errors.password?.message}
        hint={`At least ${PASSWORD_MIN} characters. A short phrase is easy to remember and hard to guess.`}
      >
        <PasswordInput
          id="register-password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "register-password-error" : undefined}
          {...register("password")}
        />
      </Field>
      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-[13px] text-muted text-pretty">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
