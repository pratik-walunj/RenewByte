"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, Clock, Loader2, Search, Truck } from "lucide-react";
import type { z } from "zod";
import { trackOrder } from "@/app/(store)/track-order/actions";
import { trackOrderSchema } from "@/lib/validation/checkout";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { applyFieldErrors, FormAlert } from "@/components/auth/password-input";
import { OrderItemsList, OrderStatusBadge } from "@/components/orders/order-parts";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { formatOrderDate, formatOrderDateTime, type TrackingView } from "@/components/orders/order-view";

type Values = z.input<typeof trackOrderSchema>;

export function TrackOrderForm({ initialOrderNumber = "" }: { initialOrderNumber?: string }) {
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<TrackingView | null>(null);
  const resultRef = React.useRef<HTMLHeadingElement>(null);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(trackOrderSchema),
    defaultValues: { orderNumber: initialOrderNumber, contact: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await trackOrder(values);
    if (!res.ok) {
      setResult(null);
      setError(res.error);
      applyFieldErrors(res.fieldErrors, setFieldError);
      return;
    }
    setResult(res.order);
  });

  // Move focus to a new result so keyboard and screen-reader users land on it.
  React.useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-10">
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6 lg:sticky lg:top-28"
        aria-label="Find your order"
      >
        <FormAlert message={error} />
        <Field
          label="Order number"
          htmlFor="track-order-number"
          error={errors.orderNumber?.message}
          hint="You'll find it in your confirmation email, e.g. RB-260924-7KQ4M"
        >
          <Input
            id="track-order-number"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="RB-"
            className="font-mono uppercase placeholder:normal-case"
            aria-invalid={errors.orderNumber ? true : undefined}
            aria-describedby={errors.orderNumber ? "track-order-number-error" : undefined}
            {...register("orderNumber")}
          />
        </Field>
        <Field
          label="Email or phone number"
          htmlFor="track-contact"
          error={errors.contact?.message}
          hint="The one you used when placing the order"
        >
          <Input
            id="track-contact"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={errors.contact ? true : undefined}
            aria-describedby={errors.contact ? "track-contact-error" : undefined}
            {...register("contact")}
          />
        </Field>
        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Search aria-hidden />}
          {isSubmitting ? "Looking up…" : "Track order"}
        </Button>
      </form>

      <div aria-live="polite" className="min-w-0">
        {result ? (
          <TrackingResult order={result} headingRef={resultRef} />
        ) : (
          <div className="hidden rounded-2xl border border-dashed border-border-strong p-8 text-center lg:block">
            <Truck className="mx-auto mb-3 size-8 text-faint" strokeWidth={1.5} aria-hidden />
            <p className="font-medium">Your order status will appear here</p>
            <p className="mt-1 text-sm text-muted">
              Enter your order number and the email or phone you ordered with.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TrackingResult({
  order,
  headingRef,
}: {
  order: TrackingView;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const closed = order.status === "CANCELLED" || order.status === "REFUNDED";
  const awaitingPayment =
    !closed &&
    order.paymentMethod === "RAZORPAY" &&
    order.paymentStatus !== "CAPTURED" &&
    (order.status === "PENDING" || order.status === "PAYMENT_PROCESSING");
  const closedAt = order.status === "REFUNDED" ? (order.lastUpdate?.at ?? null) : order.cancelledAt;

  return (
    <section className="space-y-4 motion-safe:animate-fade-in" aria-labelledby="track-result-heading">
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2
            id="track-result-heading"
            ref={headingRef}
            tabIndex={-1}
            className="num font-mono text-lg font-semibold tracking-tight outline-none"
          >
            {order.orderNumber}
          </h2>
          <OrderStatusBadge status={order.status} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[13px] text-muted">Placed</dt>
            <dd className="num">{formatOrderDate(order.placedAt)}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-muted">Order total</dt>
            <dd className="num">{formatPrice(order.total)}</dd>
          </div>
          {order.deliveryCity && (
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <dt className="text-[13px] text-muted">Delivering to</dt>
              <dd className="truncate">{order.deliveryCity}</dd>
            </div>
          )}
        </dl>

        {closed && (
          <div className="mt-5 flex gap-3 rounded-xl bg-sale-soft p-4 text-sm">
            <Ban className="mt-0.5 size-4 shrink-0 text-sale" aria-hidden />
            <div>
              <p className="font-medium text-sale">
                {order.status === "REFUNDED" ? "This order has been refunded" : "This order has been cancelled"}
              </p>
              <p className="mt-0.5 text-foreground/80">
                {order.status === "REFUNDED"
                  ? "The refund goes back to the original payment method. How quickly it appears depends on your bank."
                  : "If you were charged, the amount will be refunded to your original payment method. Contact us if you have any questions."}
              </p>
            </div>
          </div>
        )}

        {awaitingPayment && (
          <div className="mt-5 flex gap-3 rounded-xl bg-warning-soft p-4 text-sm">
            <Clock className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <p className="text-foreground/80">
              <span className="font-medium text-warning">Awaiting payment.</span> Open the link in your order email to
              complete payment, or contact us for help.
            </p>
          </div>
        )}

        {(order.courier || order.trackingNumber) && (
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-subtle px-4 py-3 text-sm">
            <Truck className="size-4 text-muted" aria-hidden />
            {order.courier && (
              <span>
                <span className="text-muted">Courier:</span> {order.courier}
              </span>
            )}
            {order.trackingNumber && (
              <span className="min-w-0 break-all">
                <span className="text-muted">Tracking no.:</span>{" "}
                <span className="num font-mono">{order.trackingNumber}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h3 className="mb-5 text-[15px] font-semibold tracking-tight">Progress</h3>
        <OrderTimeline steps={order.timeline} status={order.status} closedAt={closedAt} />
        {order.lastUpdate?.note && !closed && (
          <p className="mt-5 border-t border-border pt-4 text-[13px] text-muted">
            Latest update ({formatOrderDateTime(order.lastUpdate.at)}): {order.lastUpdate.note}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h3 className="mb-4 text-[15px] font-semibold tracking-tight">Items</h3>
        <OrderItemsList items={order.items} compact />
      </div>
    </section>
  );
}
