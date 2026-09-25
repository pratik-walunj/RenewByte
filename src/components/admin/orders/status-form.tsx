"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import type { OrderStatus } from "@/generated/prisma/enums";
import { changeOrderStatus } from "@/app/actions/admin/orders";
import { orderStatusSchema, type OrderStatusValues } from "@/server/admin/schemas/order";
import { Grid, SelectField, TextAreaField, TextField } from "@/components/admin/form/fields";

export function OrderStatusForm({
  orderId,
  current,
  next,
  courier,
  trackingNumber,
}: {
  orderId: string;
  current: OrderStatus;
  next: OrderStatus[];
  courier: string | null;
  trackingNumber: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const defaults: OrderStatusValues = {
    orderId,
    status: next[0] ?? current,
    note: "",
    courier: courier ?? "",
    trackingNumber: trackingNumber ?? "",
  };
  const form = useForm<OrderStatusValues>({ resolver: zodResolver(orderStatusSchema), defaultValues: defaults });
  const status = useWatch({ control: form.control, name: "status" });
  const shipping = status === "SHIPPED" || status === "OUT_FOR_DELIVERY" || status === "DELIVERED";
  const destructive = status === "CANCELLED" || status === "REFUNDED";

  function onSubmit(values: OrderStatusValues) {
    startTransition(async () => {
      const res = await changeOrderStatus(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Order updated");
      router.refresh();
    });
  }

  if (next.length === 0) {
    return (
      <p className="text-sm text-muted">
        This order is {ORDER_STATUS_LABEL[current].toLowerCase()} — no further status changes are possible.
      </p>
    );
  }

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <SelectField
          name="status"
          label="New status"
          options={[
            ...next.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] })),
            { value: current, label: `${ORDER_STATUS_LABEL[current]} (no change — add note / tracking)` },
          ]}
        />
        {shipping && (
          <Grid>
            <TextField name="courier" label="Courier" optional placeholder="Delhivery" />
            <TextField name="trackingNumber" label="Tracking number" optional />
          </Grid>
        )}
        <TextAreaField name="note" label="Note" optional rows={2} hint="Saved to the order timeline" maxLength={500} />
        {destructive && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-[13px] text-warning">
            Stock for this order will be returned to inventory. Refunds to the customer&apos;s payment method must be issued in
            the payment dashboard.
          </p>
        )}
        <Button type="submit" variant={destructive ? "danger" : "primary"} disabled={pending} aria-busy={pending} className="sm:w-fit">
          {pending ? "Updating…" : "Update order"}
        </Button>
      </form>
    </FormProvider>
  );
}
