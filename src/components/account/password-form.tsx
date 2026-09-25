"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/app/actions/account";
import { changePasswordSchema, PASSWORD_MIN, type ChangePasswordInput } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { applyFieldErrors, FormAlert, PasswordInput } from "@/components/auth/password-input";

export function PasswordForm({ email }: { email: string }) {
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await changePassword(values);
    if (!res.ok) {
      if (res.fieldErrors) applyFieldErrors(res.fieldErrors, setFieldError);
      else setError(res.error);
      return;
    }
    reset();
    toast.success(res.message);
  });

  const aria = (name: keyof ChangePasswordInput, id: string) =>
    errors[name] ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-lg flex-col gap-4">
      <FormAlert message={error} />
      {/* Lets password managers update the right saved login. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <Field label="Current password" htmlFor="pw-current" error={errors.currentPassword?.message}>
        <PasswordInput
          id="pw-current"
          autoComplete="current-password"
          {...aria("currentPassword", "pw-current")}
          {...register("currentPassword")}
        />
      </Field>
      <Field
        label="New password"
        htmlFor="pw-new"
        error={errors.newPassword?.message}
        hint={`At least ${PASSWORD_MIN} characters.`}
      >
        <PasswordInput id="pw-new" autoComplete="new-password" {...aria("newPassword", "pw-new")} {...register("newPassword")} />
      </Field>
      <Field label="Confirm new password" htmlFor="pw-confirm" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="pw-confirm"
          autoComplete="new-password"
          {...aria("confirmPassword", "pw-confirm")}
          {...register("confirmPassword")}
        />
      </Field>
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}
