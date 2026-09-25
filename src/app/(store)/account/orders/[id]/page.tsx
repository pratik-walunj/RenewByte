import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Ban, Truck } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/cms";
import { PAYMENT_STATUS_LABEL } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import { buildTimeline, getOrderForViewer } from "@/server/orders";
import { OrderTimeline } from "@/components/orders/order-timeline";
import {
  AddressBlock,
  OrderItemsList,
  OrderPanel,
  OrderStatusBadge,
  OrderSupport,
  OrderTotals,
} from "@/components/orders/order-parts";
import {
  canRetryPayment,
  formatOrderDate,
  formatOrderDateTime,
  isClosedStatus,
  parseShippingAddress,
  normaliseOrderNumber,
  PAYMENT_METHOD_LABEL,
  toItemView,
  toTotalsView,
} from "@/components/orders/order-view";
import { RetryPaymentButton } from "@/components/orders/retry-payment";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  return pageMetadata({ title: `Order ${id.slice(0, 40)}`, path: `/account/orders/${encodeURIComponent(id)}`, noindex: true });
}

export default async function AccountOrderPage({ params }: { params: Params }) {
  const { id } = await params;
  const orderNumber = normaliseOrderNumber(id);
  const user = await requireUser(`/account/orders/${encodeURIComponent(orderNumber)}`);
  const order = await getOrderForViewer(orderNumber, { userId: user.id });
  if (!order) notFound();

  const site = await getSiteSettings();
  const timeline = buildTimeline(order);
  const address = parseShippingAddress(order.shippingAddress);
  const closed = isClosedStatus(order.status);
  const retry = canRetryPayment(order);
  const paid = order.paymentStatus === "CAPTURED";
  const payment = order.payments[0];
  const closedAt =
    order.status === "REFUNDED"
      ? (order.events.findLast((e) => e.status === "REFUNDED")?.createdAt.toISOString() ?? null)
      : (order.cancelledAt?.toISOString() ?? null);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/account/orders"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> All orders
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="num font-mono text-xl font-semibold tracking-tight sm:text-2xl">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-muted">
          Placed on <time dateTime={order.placedAt.toISOString()}>{formatOrderDateTime(order.placedAt)}</time>
        </p>
      </div>

      {retry && (
        <div className="rounded-xl border border-warning/30 bg-warning-soft p-4 sm:p-5">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">Payment not completed</h2>
              <p className="mt-1 text-sm text-foreground/80">
                We&apos;re holding your laptop for a short while. Complete the payment to confirm the order — if it
                isn&apos;t paid in time the reservation is released automatically.
              </p>
              <RetryPaymentButton orderNumber={order.orderNumber} className="mt-4" size="md" label="Complete payment" />
            </div>
          </div>
        </div>
      )}

      {closed && (
        <div className="flex gap-3 rounded-xl border border-sale/20 bg-sale-soft p-4 sm:p-5">
          <Ban className="mt-0.5 size-5 shrink-0 text-sale" aria-hidden />
          <div className="min-w-0 text-sm">
            <h2 className="text-base font-semibold">
              {order.status === "REFUNDED" ? "This order was refunded" : "This order was cancelled"}
            </h2>
            <p className="mt-1 text-foreground/80">
              {order.status === "REFUNDED"
                ? "The refund goes back to your original payment method. How quickly it appears depends on your bank."
                : paid
                  ? "As the payment was received, a refund will be issued to your original payment method. Contact us if you have questions."
                  : "No payment was taken for this order. The items may still be available to order again."}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <OrderPanel title="Tracking">
            <OrderTimeline steps={timeline} status={order.status} closedAt={closedAt} />
            {(order.courier || order.trackingNumber) && (
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-subtle px-3.5 py-3 text-sm">
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
          </OrderPanel>

          <OrderPanel title={`Items (${order.items.length})`}>
            <OrderItemsList items={order.items.map(toItemView)} />
          </OrderPanel>
        </div>

        <div className="min-w-0 space-y-6">
          <OrderPanel title="Payment summary">
            <dl className="mb-4 space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Method</dt>
                <dd className="text-right">
                  {PAYMENT_METHOD_LABEL[order.paymentMethod]}
                  {payment?.method && <span className="text-muted"> · {payment.method.toUpperCase()}</span>}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Status</dt>
                <dd className="text-right">
                  {order.paymentMethod === "COD" && !paid ? "Pay on delivery" : PAYMENT_STATUS_LABEL[order.paymentStatus]}
                </dd>
              </div>
              {order.paidAt && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Paid on</dt>
                  <dd className="text-right">{formatOrderDate(order.paidAt)}</dd>
                </div>
              )}
            </dl>
            <div className="border-t border-border pt-4">
              <OrderTotals totals={toTotalsView(order)} paid={paid} />
            </div>
          </OrderPanel>

          <OrderPanel title="Delivery address">
            <AddressBlock address={address} />
            <p className="mt-3 text-[13px] text-muted">
              {order.deliveryMethod === "EXPRESS" ? "Express delivery" : "Standard delivery"}
            </p>
          </OrderPanel>

          <OrderPanel title="Need help with this order?">
            <p className="mb-4 text-sm text-muted">
              Quote your order number and we&apos;ll pick it up straight away.
            </p>
            <OrderSupport orderNumber={order.orderNumber} email={site.email} phone={site.phone} />
            <p className="mt-4 text-[13px] text-muted">
              See our{" "}
              <Link href="/warranty" className="underline underline-offset-2 hover:text-foreground">
                warranty
              </Link>{" "}
              and{" "}
              <Link href="/returns" className="underline underline-offset-2 hover:text-foreground">
                returns
              </Link>{" "}
              policies.
            </p>
          </OrderPanel>
        </div>
      </div>
    </div>
  );
}
