"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveCoupon } from "@/app/actions/admin/coupons";
import { couponSchema, type CouponFormValues } from "@/server/admin/schemas/coupon";
import type { Option } from "@/server/admin/types";
import { CheckboxField, FormSection, Grid, NumberField, SelectField, TextField } from "@/components/admin/form/fields";
import { MultiSelectField } from "@/components/admin/form/multi-select";

export function CouponForm({
  couponId,
  initial,
  products,
  categories,
}: {
  couponId: string | null;
  initial: CouponFormValues;
  products: Option[];
  categories: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<CouponFormValues>({ resolver: zodResolver(couponSchema), defaultValues: initial, mode: "onTouched" });
  const type = useWatch({ control: form.control, name: "type" });

  function onValid(values: CouponFormValues) {
    startTransition(async () => {
      const res = await saveCoupon(couponId, { ...values, code: values.code.toUpperCase() });
      if (!res.ok) {
        for (const [k, m] of Object.entries(res.fieldErrors ?? {})) {
          if (m?.[0]) form.setError(k as Path<CouponFormValues>, { message: m[0] }, { shouldFocus: true });
        }
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Saved");
      router.push("/admin/coupons");
      router.refresh();
    });
  }

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onValid)} className="flex flex-col gap-4">
        <FormSection id="coupon-basics" title="Code & discount">
          <Grid>
            <TextField
              name="code"
              label="Code"
              className="font-mono uppercase"
              autoCapitalize="characters"
              placeholder="WELCOME10"
              hint="Saved in capitals; customers can type it in any case."
            />
            <TextField name="description" label="Internal description" optional placeholder="Newsletter welcome offer" />
          </Grid>
          <Grid cols={3}>
            <SelectField
              name="type"
              label="Type"
              options={[
                { value: "PERCENTAGE", label: "Percentage off" },
                { value: "FIXED", label: "Fixed amount off" },
              ]}
            />
            <NumberField
              name="value"
              label={type === "PERCENTAGE" ? "Discount (%)" : "Discount (₹)"}
              step={type === "PERCENTAGE" ? "1" : "0.01"}
              min={0}
              suffix={type === "PERCENTAGE" ? "%" : "₹"}
            />
            {type === "PERCENTAGE" && (
              <NumberField name="maxDiscountRupees" label="Maximum discount (₹)" nullable optional step="0.01" hint="Caps large orders" />
            )}
          </Grid>
          <NumberField name="minOrderRupees" label="Minimum order value (₹)" step="0.01" min={0} hint="0 for no minimum" className="sm:max-w-xs" />
        </FormSection>

        <FormSection id="coupon-limits" title="Validity & limits">
          <Grid>
            <TextField name="startsAt" label="Starts on" type="date" optional hint="From 12:00 am IST" />
            <TextField name="expiresAt" label="Expires on" type="date" optional hint="Until 11:59 pm IST" />
            <NumberField name="usageLimit" label="Total uses" nullable optional min={1} hint="Blank for unlimited" />
            <NumberField name="perUserLimit" label="Uses per customer" nullable optional min={1} hint="Blank for unlimited" />
          </Grid>
          <CheckboxField name="isActive" label="Active" hint="Paused coupons are rejected at checkout." />
        </FormSection>

        <FormSection
          id="coupon-scope"
          title="Applies to"
          description="Leave both lists empty to apply the coupon to the whole cart. Otherwise only matching items are discounted."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <MultiSelectField name="categoryIds" label="Categories" options={categories} />
            <MultiSelectField name="productIds" label="Products" options={products} searchPlaceholder="Filter by name or SKU…" />
          </div>
        </FormSection>

        <div className="sticky bottom-0 z-20 -mx-4 flex justify-end gap-3 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/coupons")} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Saving…" : couponId ? "Save coupon" : "Create coupon"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
