"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/account";
import { profileSchema, type ProfileInput } from "@/lib/validation/auth";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { applyFieldErrors, FormAlert } from "@/components/auth/password-input";

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const router = useRouter();
  const { refresh } = useStore();
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: { name, phone } });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await updateProfile(values);
    if (!res.ok) {
      setError(res.error);
      applyFieldErrors(res.fieldErrors, setFieldError);
      return;
    }
    toast.success(res.message);
    reset(values);
    // The header shows the customer's first name.
    void refresh();
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-lg flex-col gap-4">
      <FormAlert message={error} />
      <Field label="Full name" htmlFor="profile-name" error={errors.name?.message}>
        <Input
          id="profile-name"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "profile-name-error" : undefined}
          {...register("name")}
        />
      </Field>
      <Field
        label="Email"
        htmlFor="profile-email"
        hint="Your email is your sign-in ID. Contact support if you need to change it."
      >
        <Input id="profile-email" type="email" value={email} readOnly disabled autoComplete="email" />
      </Field>
      <Field
        label="Mobile number"
        htmlFor="profile-phone"
        error={errors.phone?.message}
        hint="Used for delivery updates only."
        optional
      >
        <Input
          id="profile-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="10-digit mobile"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "profile-phone-error" : undefined}
          {...register("phone")}
        />
      </Field>
      <div>
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
