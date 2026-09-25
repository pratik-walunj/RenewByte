"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { INDIAN_STATES } from "@/lib/constants";
import { saveShippingZone } from "@/app/actions/admin/settings";
import { shippingZoneSchema, type ShippingZoneValues } from "@/server/admin/schemas/settings";
import { CheckboxField, Grid, NumberField, RootError, TextField } from "@/components/admin/form/fields";
import { MultiSelectField } from "@/components/admin/form/multi-select";

const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ value: s, label: s }));

const BLANK: ShippingZoneValues = {
  name: "",
  states: [],
  pincodePrefixes: "",
  feeRupees: 0,
  expressFeeRupees: null,
  minDays: 3,
  maxDays: 6,
  isActive: true,
  sortOrder: 0,
};

export function ZoneDialog({ id, initial }: { id?: string; initial?: ShippingZoneValues }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {id ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${initial?.name ?? "zone"}`}>
            <Pencil />
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> New zone
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{id ? "Edit shipping zone" : "New shipping zone"}</DialogTitle>
        <DialogDescription className="mt-1">
          A pincode-prefix match wins over a state match; among zones, lower sort order is checked first. The matching zone sets the fee and delivery estimate.
        </DialogDescription>
        {open && <ZoneForm id={id ?? null} initial={initial ?? BLANK} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ZoneForm({ id, initial, onDone }: { id: string | null; initial: ShippingZoneValues; onDone: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<ShippingZoneValues>({ resolver: zodResolver(shippingZoneSchema), defaultValues: initial });

  function onValid(values: ShippingZoneValues) {
    startTransition(async () => {
      const res = await saveShippingZone(id, values);
      if (!res.ok) {
        for (const [k, m] of Object.entries(res.fieldErrors ?? {})) {
          if (m?.[0]) form.setError(k as Path<ShippingZoneValues>, { message: m[0] });
        }
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Saved");
      onDone();
      router.refresh();
    });
  }

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onValid)} className="mt-5 flex flex-col gap-4">
        <Grid>
          <TextField name="name" label="Zone name" placeholder="Metro cities" />
          <NumberField name="sortOrder" label="Sort order" hint="Lower numbers are checked first" />
        </Grid>
        <div>
          <MultiSelectField name="states" label="States & union territories" options={STATE_OPTIONS} />
          <RootError name="states" />
        </div>
        <TextField name="pincodePrefixes" label="Pincode prefixes" optional placeholder="110, 400, 5600" hint="Comma-separated, 1–6 digits each" />
        <Grid>
          <NumberField name="feeRupees" label="Standard fee (₹)" step="0.01" min={0} />
          <NumberField name="expressFeeRupees" label="Express fee (₹)" step="0.01" nullable optional hint="Blank uses the store default" />
          <NumberField name="minDays" label="Delivery from (days)" min={0} />
          <NumberField name="maxDays" label="Delivery to (days)" min={0} />
        </Grid>
        <CheckboxField name="isActive" label="Active" />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Saving…" : "Save zone"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
