import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { formatDateTime, formatPrice } from "@/lib/format";
import { GRADE_LABEL, ORDER_STATUS_LABEL } from "@/lib/constants";
import { allowedNextStatuses } from "@/server/orders";
import { getAdminOrder, readAddress } from "@/server/admin/orders";
import { AdminPageHeader, Meta, Panel } from "@/components/admin/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/badges";
import { OrderStatusForm } from "@/components/admin/orders/status-form";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const order = await getAdminOrder(id);
  return { title: order ? `Order ${order.orderNumber}` : "Order not found" };
}

export default async function AdminOrderPage({ params }: Props) {
  await requireStaff();
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();
  const address = readAddress(order.shippingAddress);

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        eyebrow={`Placed ${formatDateTime(order.placedAt)}`}
        title={order.orderNumber}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
            <span className="text-[13px]">
              {order.paymentMethod === "COD" ? "Cash on delivery" : "Online payment"} ·{" "}
              {order.deliveryMethod === "EXPRESS" ? "Express" : "Standard"} delivery
            </span>
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel id="items" title="Items" bodyClassName="p-0 sm:p-0">
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex min-w-0 gap-3 px-4 py-3 sm:px-5">
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-subtle">
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- snapshot URL may be any host
                      <img src={item.imageUrl} alt="" className="size-full object-contain" loading="lazy" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.productId ? (
                      <Link href={`/admin/products/${item.productId}`} className="line-clamp-2 text-sm font-medium hover:underline">
                        {item.name}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                    )}
                    <p className="truncate text-xs text-muted">
                      <span className="font-mono">{item.sku}</span> · {GRADE_LABEL[item.conditionGrade]} · {item.warrantyMonths}-month warranty
                    </p>
                    <p className="num mt-1 text-xs text-muted">
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <span className="num shrink-0 text-sm font-medium">{formatPrice(item.total)}</span>
                </li>
              ))}
            </ul>
            <dl className="num flex flex-col gap-1.5 border-t border-border px-4 py-4 sm:px-5">
              <Meta label="Subtotal">{formatPrice(order.subtotal)}</Meta>
              {order.discount > 0 && (
                <Meta label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}>−{formatPrice(order.discount)}</Meta>
              )}
              <Meta label="Shipping">{order.shippingFee ? formatPrice(order.shippingFee) : "Free"}</Meta>
              {order.codFee > 0 && <Meta label="COD fee">{formatPrice(order.codFee)}</Meta>}
              <Meta label="GST">{formatPrice(order.tax, { precise: true })}</Meta>
              <Meta label="Total" className="mt-1 border-t border-border pt-2 text-base font-semibold">
                {formatPrice(order.total)}
              </Meta>
            </dl>
          </Panel>

          <Panel id="payments" title="Payment attempts" bodyClassName="p-0 sm:p-0">
            {order.payments.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">
                {order.paymentMethod === "COD" ? "Cash on delivery — collected by the courier." : "No payment attempts yet."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs">{p.providerPaymentId ?? p.providerOrderId}</p>
                      <p className="text-xs text-muted">
                        {p.provider} {p.method ? `· ${p.method}` : ""} · {formatDateTime(p.createdAt)}
                      </p>
                      {p.errorDescription && <p className="mt-1 text-xs text-sale">{p.errorDescription}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <PaymentStatusBadge status={p.status} />
                      <span className="num text-sm">{formatPrice(p.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel id="timeline" title="Status history">
            <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
              {order.events.map((e) => (
                <li key={e.id} className="relative">
                  <span aria-hidden className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-surface bg-foreground" />
                  <p className="text-sm font-medium">{ORDER_STATUS_LABEL[e.status]}</p>
                  <p className="text-xs text-muted">
                    {formatDateTime(e.createdAt)}
                    {e.user ? ` · ${e.user.name}` : ""}
                  </p>
                  {e.note && <p className="mt-1 text-sm text-muted">{e.note}</p>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel id="update" title="Update status">
            <OrderStatusForm
              orderId={order.id}
              current={order.status}
              next={allowedNextStatuses(order.status)}
              courier={order.courier}
              trackingNumber={order.trackingNumber}
            />
          </Panel>

          <Panel id="customer" title="Customer">
            <dl className="flex flex-col gap-1.5">
              <Meta label="Name">{order.customerName}</Meta>
              <Meta label="Email">
                <a href={`mailto:${order.email}`} className="break-all hover:underline">
                  {order.email}
                </a>
              </Meta>
              <Meta label="Phone">
                <a href={`tel:${order.phone}`} className="hover:underline">
                  {order.phone}
                </a>
              </Meta>
              <Meta label="Account">
                {order.user ? (
                  <Link href={`/admin/customers/${order.user.id}`} className="text-accent hover:underline">
                    View customer
                  </Link>
                ) : (
                  "Guest checkout"
                )}
              </Meta>
            </dl>
            {order.notes && (
              <div className="mt-3 rounded-lg bg-subtle p-3 text-sm">
                <p className="eyebrow mb-1">Customer note</p>
                <p className="break-words">{order.notes}</p>
              </div>
            )}
          </Panel>

          <Panel id="shipping" title="Shipping address">
            <address className="text-sm leading-relaxed not-italic">
              {address.name && <span className="block font-medium">{address.name}</span>}
              {address.line1 && <span className="block">{address.line1}</span>}
              {address.line2 && <span className="block">{address.line2}</span>}
              {address.landmark && <span className="block text-muted">Near {address.landmark}</span>}
              <span className="block">
                {[address.city, address.state].filter(Boolean).join(", ")} {address.pincode}
              </span>
              {address.phone && <span className="mt-1 block text-muted">{address.phone}</span>}
            </address>
            {(order.courier || order.trackingNumber) && (
              <dl className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
                {order.courier && <Meta label="Courier">{order.courier}</Meta>}
                {order.trackingNumber && (
                  <Meta label="Tracking">
                    <span className="font-mono text-xs">{order.trackingNumber}</span>
                  </Meta>
                )}
              </dl>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
