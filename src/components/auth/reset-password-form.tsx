"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resetPassword } from "@/app/actions/auth";
import { PASSWORD_MIN, resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { applyFieldErrors, FormAlert, PasswordInput } from "@/components/auth/password-input";

export function ResetPasswordForm({ token, email }: { token: string; email?: string }) {
  const router = useRouter();
  const { refresh } = useStore();
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await resetPassword(values);
    if (!res.ok) {
      setError(res.error);
      applyFieldErrors(res.fieldErrors, setFieldError);
      return;
    }
    toast.success("Password updated — you're signed in.");
    await refresh();
    router.replace(res.redirectTo);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {error && (
        <div className="flex flex-col gap-2">
          <FormAlert message={error} />
          {error.includes("expired") && (
            <Link href="/forgot-password" className="text-sm font-medium text-accent hover:underline">
              Request a new reset link
            </Link>
          )}
        </div>
      )}
      <input type="hidden" {...register("token")} />
      {/* Lets password managers attach the new password to the right account. */}
      {email && <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />}
      <Field
        label="New password"
        htmlFor="reset-password"
        error={errors.password?.message}
        hint={`At least ${PASSWORD_MIN} characters.`}
      >
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "reset-password-error" : undefined}
          {...register("password")}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="reset-confirm" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="reset-confirm"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? true : undefined}
          aria-describedby={errors.confirmPassword ? "reset-confirm-error" : undefined}
          {...register("confirmPassword")}
        />
      </Field>
      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {isSubmitting ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
