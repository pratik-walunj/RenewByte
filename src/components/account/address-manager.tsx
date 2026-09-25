"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/app/actions/account";
import { INDIAN_STATES } from "@/lib/constants";
import { accountAddressSchema, MAX_ADDRESSES, type AccountAddressInput } from "@/lib/validation/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Label, NativeSelect } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { Checkbox } from "@/components/ui/primitives";
import { applyFieldErrors, FormAlert } from "@/components/auth/password-input";

export type SavedAddress = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type Editing = { mode: "create" } | { mode: "edit"; address: SavedAddress } | null;

export function AddressManager({
  addresses,
  defaults,
}: {
  addresses: SavedAddress[];
  defaults: { fullName: string; phone: string };
}) {
  const [editing, setEditing] = React.useState<Editing>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<SavedAddress | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const atLimit = addresses.length >= MAX_ADDRESSES;

  async function makeDefault(id: string) {
    setBusyId(id);
    const res = await setDefaultAddress(id);
    setBusyId(null);
    if (res.ok) toast.success(res.message);
    else toast.error(res.error);
  }

  async function remove() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setBusyId(id);
    const res = await deleteAddress(id);
    setBusyId(null);
    setConfirmDelete(null);
    if (res.ok) toast.success(res.message);
    else toast.error(res.error);
  }

  return (
    <>
      {addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin />}
          title="No saved addresses"
          description="Add an address to check out faster next time."
        >
          <Button onClick={() => setEditing({ mode: "create" })}>
            <Plus aria-hidden /> Add address
          </Button>
        </EmptyState>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {addresses.map((a) => (
              <li
                key={a.id}
                className="flex flex-col rounded-xl border border-border bg-surface p-4 data-[default=true]:border-foreground/30"
                data-default={a.isDefault}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {a.label && <Badge tone="outline">{a.label}</Badge>}
                  {a.isDefault && <Badge tone="dark">Default</Badge>}
                </div>
                <address className="flex-1 text-sm leading-relaxed not-italic">
                  <span className="font-medium">{a.fullName}</span>
                  <br />
                  {a.line1}
                  {a.line2 && (
                    <>
                      <br />
                      {a.line2}
                    </>
                  )}
                  {a.landmark && (
                    <>
                      <br />
                      Near {a.landmark}
                    </>
                  )}
                  <br />
                  {a.city}, {a.state} <span className="num">{a.pincode}</span>
                  <br />
                  <span className="num text-muted">+91 {a.phone}</span>
                </address>
                <div className="mt-4 flex flex-wrap gap-1 border-t border-border pt-3">
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ mode: "edit", address: a })}>
                    <Pencil aria-hidden /> Edit
                  </Button>
                  {!a.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => makeDefault(a.id)} disabled={busyId === a.id}>
                      {busyId === a.id ? <Loader2 className="animate-spin" aria-hidden /> : <Star aria-hidden />}
                      Set as default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sale hover:bg-sale-soft"
                    onClick={() => setConfirmDelete(a)}
                    aria-label={`Delete address${a.label ? ` “${a.label}”` : ""} at ${a.line1}`}
                  >
                    <Trash2 aria-hidden /> Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={() => setEditing({ mode: "create" })} disabled={atLimit}>
              <Plus aria-hidden /> Add address
            </Button>
            {atLimit && (
              <p className="text-[13px] text-muted">You&apos;ve reached the limit of {MAX_ADDRESSES} addresses.</p>
            )}
          </div>
        </>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogTitle>{editing?.mode === "edit" ? "Edit address" : "Add a new address"}</DialogTitle>
          <DialogDescription className="mt-1">We deliver across India. All fields except those marked optional are required.</DialogDescription>
          {editing && (
            <AddressForm
              key={editing.mode === "edit" ? editing.address.id : "new"}
              address={editing.mode === "edit" ? editing.address : null}
              defaults={defaults}
              isFirst={addresses.length === 0}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete !== null} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Delete this address?</DialogTitle>
          <DialogDescription className="mt-1.5">
            {confirmDelete ? `${confirmDelete.line1}, ${confirmDelete.city}` : ""}. This can&apos;t be undone.
          </DialogDescription>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={remove} disabled={busyId === confirmDelete?.id}>
              {busyId === confirmDelete?.id && <Loader2 className="animate-spin" aria-hidden />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddressForm({
  address,
  defaults,
  isFirst,
  onDone,
}: {
  address: SavedAddress | null;
  defaults: { fullName: string; phone: string };
  isFirst: boolean;
  onDone: () => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<AccountAddressInput>({
    resolver: zodResolver(accountAddressSchema),
    defaultValues: {
      label: address?.label ?? "",
      fullName: address?.fullName ?? defaults.fullName,
      phone: address?.phone ?? defaults.phone,
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? "",
      landmark: address?.landmark ?? "",
      city: address?.city ?? "",
      state: (address?.state ?? "") as AccountAddressInput["state"],
      pincode: address?.pincode ?? "",
      isDefault: address?.isDefault ?? isFirst,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await saveAddress(values, address?.id ?? null);
    if (!res.ok) {
      setError(res.error);
      applyFieldErrors(res.fieldErrors, setFieldError);
      return;
    }
    toast.success(res.message);
    onDone();
  });

  const invalid = (name: keyof AccountAddressInput) =>
    errors[name] ? { "aria-invalid": true as const, "aria-describedby": `addr-${name}-error` } : {};

  return (
    <form onSubmit={onSubmit} noValidate className="mt-5 flex flex-col gap-4">
      <FormAlert message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="addr-fullName" error={errors.fullName?.message}>
          <Input id="addr-fullName" autoComplete="shipping name" {...invalid("fullName")} {...register("fullName")} />
        </Field>
        <Field label="Mobile number" htmlFor="addr-phone" error={errors.phone?.message}>
          <Input
            id="addr-phone"
            type="tel"
            inputMode="tel"
            autoComplete="shipping tel-national"
            placeholder="10-digit mobile"
            {...invalid("phone")}
            {...register("phone")}
          />
        </Field>
      </div>
      <Field label="House / flat, street" htmlFor="addr-line1" error={errors.line1?.message}>
        <Input id="addr-line1" autoComplete="shipping address-line1" {...invalid("line1")} {...register("line1")} />
      </Field>
      <Field label="Area, locality" htmlFor="addr-line2" error={errors.line2?.message} optional>
        <Input id="addr-line2" autoComplete="shipping address-line2" {...invalid("line2")} {...register("line2")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Landmark" htmlFor="addr-landmark" error={errors.landmark?.message} optional>
          <Input id="addr-landmark" {...invalid("landmark")} {...register("landmark")} />
        </Field>
        <Field label="City" htmlFor="addr-city" error={errors.city?.message}>
          <Input id="addr-city" autoComplete="shipping address-level2" {...invalid("city")} {...register("city")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="State" htmlFor="addr-state" error={errors.state?.message}>
          <NativeSelect id="addr-state" autoComplete="shipping address-level1" {...invalid("state")} {...register("state")}>
            <option value="" disabled>
              Select state
            </option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="PIN code" htmlFor="addr-pincode" error={errors.pincode?.message}>
          <Input
            id="addr-pincode"
            inputMode="numeric"
            maxLength={6}
            autoComplete="shipping postal-code"
            {...invalid("pincode")}
            {...register("pincode")}
          />
        </Field>
      </div>
      <Field
        label="Label"
        htmlFor="addr-label"
        error={errors.label?.message}
        hint="For example Home, Office or Parents"
        optional
      >
        <Input id="addr-label" maxLength={30} {...invalid("label")} {...register("label")} />
      </Field>
      {!(address?.isDefault ?? false) && (
        <Controller
          control={control}
          name="isDefault"
          render={({ field }) => (
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="addr-default"
                checked={Boolean(field.value)}
                onCheckedChange={(v) => field.onChange(v === true)}
                onBlur={field.onBlur}
                ref={field.ref}
              />
              <Label htmlFor="addr-default" className="font-normal">
                Make this my default address
              </Label>
            </div>
          )}
        />
      )}
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? "Saving…" : "Save address"}
        </Button>
      </div>
    </form>
  );
}
