"use client";

import { useTransition } from "react";
import { FormProvider, useForm, useWatch, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveStoreSettings } from "@/app/actions/admin/settings";
import { storeSettingsSchema, type StoreSettingsValues } from "@/server/admin/schemas/settings";
import { CheckboxField, FormSection, Grid, NumberField } from "@/components/admin/form/fields";

export function StoreSettingsForm({ initial, canEdit }: { initial: StoreSettingsValues; canEdit: boolean }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<StoreSettingsValues>({ resolver: zodResolver(storeSettingsSchema), defaultValues: initial });
  const [expressEnabled, codEnabled] = useWatch({ control: form.control, name: ["expressEnabled", "codEnabled"] });

  function onValid(values: StoreSettingsValues) {
    startTransition(async () => {
      const res = await saveStoreSettings(values);
      if (!res.ok) {
        for (const [k, m] of Object.entries(res.fieldErrors ?? {})) {
          if (m?.[0]) form.setError(k as Path<StoreSettingsValues>, { message: m[0] });
        }
        toast.error(res.error);
        return;
      }
      form.reset(values);
      toast.success(res.message ?? "Saved");
    });
  }

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onValid)}>
        <fieldset disabled={!canEdit || pending} className="flex min-w-0 flex-col gap-4">
          <legend className="sr-only">Store settings</legend>
          <FormSection id="tax" title="Tax">
            <Grid>
              <NumberField name="taxRatePercent" label="GST rate" suffix="%" step="0.01" min={0} max={40} />
              <div className="sm:pt-7">
                <CheckboxField name="pricesIncludeTax" label="Prices include GST" hint="Product prices already contain tax." />
              </div>
            </Grid>
          </FormSection>

          <FormSection id="shipping" title="Shipping" description="Defaults used when no shipping zone matches the address.">
            <Grid>
              <NumberField name="flatShippingFeeRupees" label="Standard shipping fee (₹)" step="0.01" min={0} hint="0 for free shipping" />
              <NumberField
                name="freeShippingThresholdRupees"
                label="Free shipping above (₹)"
                step="0.01"
                min={0}
                hint="0 disables the threshold. Applies to zone fees too"
              />
            </Grid>
            <CheckboxField name="expressEnabled" label="Offer express delivery" />
            {expressEnabled && (
              <NumberField name="expressShippingFeeRupees" label="Express fee (₹)" step="0.01" min={0} className="sm:max-w-xs" />
            )}
          </FormSection>

          <FormSection id="payments" title="Payments">
            <CheckboxField
              name="razorpayEnabled"
              label="Accept online payments (Razorpay)"
              hint="Also requires Razorpay keys in the environment."
            />
            <CheckboxField name="codEnabled" label="Accept cash on delivery" />
            {codEnabled && (
              <Grid>
                <NumberField name="codFeeRupees" label="COD fee (₹)" step="0.01" min={0} />
                <NumberField
                  name="codMaxOrderRupees"
                  label="COD maximum order (₹)"
                  step="0.01"
                  nullable
                  optional
                  hint="Blank for no limit"
                />
              </Grid>
            )}
          </FormSection>

          <FormSection id="stock" title="Inventory">
            <NumberField
              name="lowStockThreshold"
              label="Default low-stock threshold"
              min={0}
              hint="Pre-filled for new products"
              className="sm:max-w-xs"
            />
          </FormSection>

          {canEdit && (
            <div className="flex justify-end">
              <Button type="submit" aria-busy={pending}>
                {pending ? "Saving…" : "Save settings"}
              </Button>
            </div>
          )}
        </fieldset>
      </form>
    </FormProvider>
  );
}
