import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";
import { formatPrice } from "@/lib/format";
import { pluralize } from "@/lib/utils";
import { ProductImage } from "@/components/product/product-image";
import { OrderStatusBadge } from "@/components/orders/order-parts";
import { canRetryPayment, formatOrderDate } from "@/components/orders/order-view";

export type OrderListItem = {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  stockReserved: boolean;
  placedAt: Date;
  total: number;
  items: { id: string; name: string; imageUrl: string | null; quantity: number }[];
};

/** Card list of orders; each card links to its detail page. */
export function OrderList({ orders }: { orders: OrderListItem[] }) {
  return (
    <ul className="space-y-3">
      {orders.map((order) => {
        const units = order.items.reduce((s, i) => s + i.quantity, 0);
        const first = order.items[0];
        const needsPayment = canRetryPayment(order);
        return (
          <li key={order.orderNumber}>
            <Link
              href={`/account/orders/${order.orderNumber}`}
              className="group flex gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-strong sm:gap-4 sm:p-4"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-stage sm:size-20">
                <ProductImage src={first?.imageUrl} alt="" fill sizes="80px" className="object-contain p-1.5" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="num font-mono text-[13px] font-medium">{order.orderNumber}</span>
                  <OrderStatusBadge status={order.status} />
                  {needsPayment && <span className="text-xs font-medium text-warning">Payment pending</span>}
                </div>
                <p className="truncate text-sm">
                  {first?.name ?? "Order"}
                  {order.items.length > 1 && <span className="text-muted"> + {order.items.length - 1} more</span>}
                </p>
                <p className="num text-[13px] text-muted">
                  {formatOrderDate(order.placedAt)} · {pluralize(units, "item")} ·{" "}
                  <span className="font-medium text-foreground">{formatPrice(order.total)}</span>
                </p>
              </div>
              <ChevronRight
                className="size-4 shrink-0 self-center text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Prisma select matching `OrderListItem`. */
export const orderListSelect = {
  orderNumber: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  stockReserved: true,
  placedAt: true,
  total: true,
  items: { select: { id: true, name: true, imageUrl: true, quantity: true } },
} as const;
