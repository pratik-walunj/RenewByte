import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import type { OrderStatus } from "@/generated/prisma/enums";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { GradeTag } from "@/components/product/grade";
import { ProductImage } from "@/components/product/product-image";
import { WhatsAppButton } from "@/components/layout/whatsapp";
import { buttonVariants } from "@/components/ui/button";
import type { OrderItemView, OrderTotalsView, ShippingAddressView } from "@/components/orders/order-view";

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <Badge tone={ORDER_STATUS_TONE[status]} className={className}>
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}

/** Titled bordered panel used across order pages. */
export function OrderPanel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-surface", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

type ItemLike = Pick<OrderItemView, "id" | "name" | "slug" | "imageUrl" | "conditionGrade" | "quantity"> &
  Partial<Pick<OrderItemView, "unitPrice" | "total" | "warrantyMonths" | "sku">>;

export function OrderItemsList({ items, compact = false }: { items: ItemLike[]; compact?: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4">
          <div
            className={cn(
              "relative shrink-0 overflow-hidden rounded-lg border border-border bg-stage",
              compact ? "size-14" : "size-16 sm:size-20",
            )}
          >
            <ProductImage src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-contain p-1.5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <Link href={`/laptops/${item.slug}`} className="line-clamp-2 text-sm font-medium hover:text-accent">
                {item.name}
              </Link>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
                <GradeTag grade={item.conditionGrade} />
                <span>Qty {item.quantity}</span>
                {item.warrantyMonths ? <span>· {item.warrantyMonths}-month warranty</span> : null}
              </div>
            </div>
            {item.total !== undefined && (
              <div className="num shrink-0 text-sm sm:text-right">
                <p className="font-medium">{formatPrice(item.total)}</p>
                {item.quantity > 1 && item.unitPrice !== undefined && (
                  <p className="text-[13px] text-muted">{formatPrice(item.unitPrice)} each</p>
                )}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Invoice-style totals. Prices are GST-inclusive, so tax is shown as an "included" note. */
export function OrderTotals({ totals, paid }: { totals: OrderTotalsView; paid?: boolean }) {
  const rows: { label: string; value: string; tone?: string }[] = [
    { label: "Subtotal", value: formatPrice(totals.subtotal) },
  ];
  if (totals.discount > 0) {
    rows.push({
      label: totals.couponCode ? `Discount (${totals.couponCode})` : "Discount",
      value: `−${formatPrice(totals.discount)}`,
      tone: "text-success",
    });
  }
  rows.push({ label: "Shipping", value: totals.shippingFee > 0 ? formatPrice(totals.shippingFee) : "Free" });
  if (totals.codFee > 0) rows.push({ label: "Cash on delivery fee", value: formatPrice(totals.codFee) });

  return (
    <dl className="num space-y-2 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-4">
          <dt className="text-muted">{r.label}</dt>
          <dd className={cn("text-right", r.tone)}>{r.value}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-semibold">
        <dt>{paid ? "Total paid" : "Order total"}</dt>
        <dd className="text-right">{formatPrice(totals.total)}</dd>
      </div>
      {totals.tax > 0 && (
        <p className="text-right text-[13px] text-muted">Includes {formatPrice(totals.tax)} GST</p>
      )}
    </dl>
  );
}

export function AddressBlock({ address }: { address: ShippingAddressView | null }) {
  if (!address) return <p className="text-sm text-muted">No address on file.</p>;
  return (
    <address className="text-sm leading-relaxed not-italic">
      <span className="font-medium">{address.name}</span>
      <br />
      {address.line1}
      {address.line2 && (
        <>
          <br />
          {address.line2}
        </>
      )}
      {address.landmark && (
        <>
          <br />
          Near {address.landmark}
        </>
      )}
      <br />
      {address.city}, {address.state} <span className="num">{address.pincode}</span>
      {address.phone && (
        <>
          <br />
          <span className="num text-muted">+91 {address.phone}</span>
        </>
      )}
    </address>
  );
}

/** WhatsApp + email + phone support buttons pre-filled with the order number. */
export function OrderSupport({
  orderNumber,
  email,
  phone,
  className,
}: {
  orderNumber: string;
  email?: string;
  phone?: string;
  className?: string;
}) {
  const message = `Hi, I need help with my order ${orderNumber}.`;
  const btn = buttonVariants({ variant: "outline", size: "md" });
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <WhatsAppButton message={message} location="order-support" className={btn} />
      {email && (
        <a
          href={`mailto:${email}?subject=${encodeURIComponent(`Help with order ${orderNumber}`)}`}
          className={btn}
        >
          <Mail aria-hidden /> Email us
        </a>
      )}
      {phone && (
        <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={btn}>
          <Phone aria-hidden /> Call
        </a>
      )}
    </div>
  );
}
