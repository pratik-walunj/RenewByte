import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban, CheckCircle2, Clock, CreditCard, PackageCheck, ShieldCheck, Truck, XCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";
import { buildTimeline, getOrderForViewer, type CustomerOrder } from "@/server/orders";
import { quoteShipping } from "@/server/shipping";
import { Button } from "@/components/ui/button";
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
  formatOrderDateTime,
  formatOrderShortDate,
  isClosedStatus,
  parseShippingAddress,
  normaliseOrderNumber,
  PAYMENT_METHOD_LABEL,
  toItemView,
  toTotalsView,
} from "@/components/orders/order-view";
import { PurchaseTracker } from "@/components/orders/purchase-tracker";
import { RefreshStatusButton, RetryPaymentButton } from "@/components/orders/retry-payment";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ token?: string | string[]; status?: string | string[] }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  return pageMetadata({
    title: "Your order",
    description: "Order confirmation and status.",
    path: `/order/${encodeURIComponent(id.slice(0, 40))}`,
    noindex: true,
  });
}

const DAY = 24 * 60 * 60 * 1000;

/** Delivery window based on the order's zone and method. Best effort — never blocks the page. */
async function estimateDelivery(order: CustomerOrder) {
  try {
    const address = parseShippingAddress(order.shippingAddress);
    const quotes = await quoteShipping({ subtotal: order.subtotal, state: address?.state, pincode: address?.pincode });
    const quote = quotes.find((q) => q.method === order.deliveryMethod) ?? quotes[0];
    if (!quote) return null;
    const from = new Date(order.placedAt.getTime() + quote.minDays * DAY);
    const to = new Date(order.placedAt.getTime() + quote.maxDays * DAY);
    return { from: from.toISOString(), to: to.toISOString(), label: quote.label };
  } catch {
    return null;
  }
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const token = typeof sp.token === "string" ? sp.token.slice(0, 200) : null;
  const failed = sp.status === "failed";
  const orderNumber = normaliseOrderNumber(id);

  const user = await getCurrentUser();
  const order = await getOrderForViewer(orderNumber, { token, userId: user?.id ?? null });
  if (!order) notFound();

  const site = await getSiteSettings();
  const closed = isClosedStatus(order.status);
  const retry = canRetryPayment(order);
  const paid = order.paymentStatus === "CAPTURED";
  const confirmed =
    !closed &&
    (paid || order.paymentMethod === "COD" || !["PENDING", "PAYMENT_PROCESSING"].includes(order.status));
  const timeline = buildTimeline(order);
  const address = parseShippingAddress(order.shippingAddress);
  const items = order.items.map(toItemView);
  const owns = Boolean(user && order.userId === user.id);
  const trackHref = owns
    ? `/account/orders/${order.orderNumber}`
    : `/track-order?order=${encodeURIComponent(order.orderNumber)}`;
  const firstName = order.customerName.split(" ")[0] || order.customerName;
  const eta = confirmed ? await estimateDelivery(order) : null;

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        {confirmed && (
          <>
            <PurchaseTracker
              orderNumber={order.orderNumber}
              value={order.total}
              items={order.items.map((i) => ({
                item_id: i.productId ?? i.sku,
                item_name: i.name,
                price: i.unitPrice,
                quantity: i.quantity,
              }))}
            />
            <header className="mb-8 text-center sm:mb-10">
              <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
                <CheckCircle2 className="size-7" aria-hidden />
              </span>
              <p className="eyebrow mb-2">Thank you, {firstName}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Your order is confirmed</h1>
              <p className="mt-3 text-[15px] text-muted text-pretty">
                Order <span className="num font-mono font-medium text-foreground">{order.orderNumber}</span> · A
                confirmation has been sent to <span className="font-medium text-foreground">{order.email}</span>
              </p>
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={trackHref}>
                    <Truck aria-hidden /> Track order
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/laptops">Continue shopping</Link>
                </Button>
              </div>
            </header>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {eta && (
                <div className="rounded-xl border border-border bg-surface p-4 sm:col-span-3">
                  <p className="eyebrow mb-1">Estimated delivery · {eta.label}</p>
                  <p className="text-lg font-semibold tracking-tight">
                    {formatOrderShortDate(eta.from)} – {formatOrderShortDate(eta.to)}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    We&apos;ll share the courier and tracking number as soon as it ships.
                  </p>
                </div>
              )}
              {[
                {
                  icon: PackageCheck,
                  title: "Final check & packing",
                  body: "Your laptop gets a last functional check before it's securely packed.",
                },
                {
                  icon: Truck,
                  title: "Shipped with tracking",
                  body: "You'll receive an email with the courier and tracking details.",
                },
                {
                  icon: ShieldCheck,
                  title: "Warranty & support",
                  body: "Keep your order number handy for any warranty or support request.",
                },
              ].map(({ icon: Icon, title, body }, i) => (
                <div key={title} className="rounded-xl border border-border bg-surface p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="num flex size-6 items-center justify-center rounded-full bg-subtle text-xs font-semibold">
                      {i + 1}
                    </span>
                    <Icon className="size-4 text-muted" aria-hidden />
                  </div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {!confirmed && !closed && (
          <header className="mb-8 rounded-2xl border border-warning/30 bg-warning-soft p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-warning">
                {failed ? <XCircle className="size-6" aria-hidden /> : <Clock className="size-6" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {failed ? "Your payment didn't go through" : "Payment pending"}
                </h1>
                <p className="mt-1.5 text-[15px] text-foreground/80 text-pretty">
                  {failed
                    ? "Nothing to worry about — your order is saved. If any amount was debited, your bank will reverse it automatically. You can try again below."
                    : "We haven't received confirmation of your payment yet. If you've just paid, it can take a minute to update."}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Order <span className="num font-mono font-medium text-foreground">{order.orderNumber}</span>
                </p>
                {retry ? (
                  <>
                    <p className="mt-2 text-sm text-muted">
                      Your items are reserved for a short time. Complete the payment to confirm your order.
                    </p>
                    <RetryPaymentButton
                      orderNumber={order.orderNumber}
                      token={token}
                      label={failed ? "Try payment again" : "Complete payment"}
                      className="mt-5"
                    />
                  </>
                ) : (
                  <RefreshStatusButton className="mt-5" />
                )}
              </div>
            </div>
          </header>
        )}

        {closed && (
          <header className="mb-8 rounded-2xl border border-border bg-surface p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sale-soft text-sale">
                <Ban className="size-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {order.status === "REFUNDED" ? "This order was refunded" : "This order was cancelled"}
                </h1>
                <p className="mt-1.5 text-[15px] text-muted text-pretty">
                  {order.status === "REFUNDED"
                    ? "The refund goes back to your original payment method. How quickly it appears depends on your bank."
                    : paid
                      ? "Your payment arrived after the order had been cancelled. We'll refund it to your original payment method — contact us if you have any questions."
                      : "The payment wasn't completed in time, so we released the reserved stock. No money was taken. If the laptop is still available you can order it again."}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Order <span className="num font-mono font-medium text-foreground">{order.orderNumber}</span>
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="/cart">Go to cart</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/laptops">Browse laptops</Link>
                  </Button>
                </div>
              </div>
            </div>
          </header>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <OrderPanel title={`Items (${items.length})`}>
              <OrderItemsList items={items} />
            </OrderPanel>
            {!closed && confirmed && (
              <OrderPanel title="Order status" action={<OrderStatusBadge status={order.status} />}>
                <OrderTimeline steps={timeline} status={order.status} />
              </OrderPanel>
            )}
          </div>
          <div className="min-w-0 space-y-6">
            <OrderPanel title="Summary">
              <OrderTotals totals={toTotalsView(order)} paid={paid} />
              <p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-[13px] text-muted">
                <CreditCard className="size-4 shrink-0" aria-hidden />
                {PAYMENT_METHOD_LABEL[order.paymentMethod]}
                {order.paymentMethod === "COD" && !paid && " · pay when it arrives"}
              </p>
              <p className="mt-1 text-[13px] text-muted">Placed {formatOrderDateTime(order.placedAt)}</p>
            </OrderPanel>
            <OrderPanel title="Shipping to">
              <AddressBlock address={address} />
            </OrderPanel>
            <OrderPanel title="Questions?">
              <OrderSupport orderNumber={order.orderNumber} email={site.email} />
            </OrderPanel>
          </div>
        </div>

        {!user && confirmed && (
          <p className="mt-8 text-center text-sm text-muted">
            Keep this page&apos;s link or your order number to track this order.{" "}
            <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>{" "}
            to check out faster next time.
          </p>
        )}
      </div>
    </div>
  );
}
