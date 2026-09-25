import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/lib/constants";
import { listOrders } from "@/server/admin/orders";
import { oneOf, pageParam, param, type SearchParams } from "@/server/admin/pagination";
import { EmptyState } from "@/components/ui/misc";
import { AdminPageHeader, CardItem, CardList, DataTable, FilterBar, FilterSelect, td, th } from "@/components/admin/ui";
import { AdminPagination } from "@/components/admin/pagination";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/badges";

export const metadata: Metadata = { title: "Orders" };

const STATUS_FILTERS = ["open", ...ORDER_STATUSES] as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const filters = { q: param(sp, "q"), status: oneOf(param(sp, "status"), STATUS_FILTERS), page: pageParam(sp) };
  const { rows, info } = await listOrders(filters);

  return (
    <>
      <AdminPageHeader eyebrow="Sales" title="Orders" description="Search, review and fulfil customer orders." />

      <FilterBar action="/admin/orders" query={filters.q} queryPlaceholder="Order number, email, phone or name" resetHref="/admin/orders">
        <FilterSelect
          name="status"
          label="Status"
          value={filters.status}
          options={[
            { value: "open", label: "Needs action" },
            ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] })),
          ]}
        />
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag />}
          title={filters.q || filters.status ? "No orders match" : "No orders yet"}
          description={filters.q || filters.status ? "Try another search or status." : "Orders will appear here as customers check out."}
        />
      ) : (
        <>
          <DataTable caption="Orders">
            <thead className="border-b border-border bg-subtle/60">
              <tr>
                <th scope="col" className={th}>Order</th>
                <th scope="col" className={th}>Customer</th>
                <th scope="col" className={th}>Status</th>
                <th scope="col" className={th}>Payment</th>
                <th scope="col" className={`${th} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-subtle/40">
                  <td className={td}>
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-[13px] font-medium hover:underline">
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-muted">{formatDateTime(o.placedAt)}</p>
                  </td>
                  <td className={td}>
                    <p className="max-w-56 truncate">{o.customerName}</p>
                    <p className="max-w-56 truncate text-xs text-muted">{o.email}</p>
                  </td>
                  <td className={td}>
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className={td}>
                    <div className="flex flex-col items-start gap-1">
                      <PaymentStatusBadge status={o.paymentStatus} />
                      <span className="text-xs text-muted">{o.paymentMethod === "COD" ? "Cash on delivery" : "Online"}</span>
                    </div>
                  </td>
                  <td className={`${td} num text-right whitespace-nowrap`}>
                    <span className="font-medium">{formatPrice(o.total)}</span>
                    <p className="text-xs text-muted">
                      {o._count.items} {o._count.items === 1 ? "item" : "items"}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>

          <CardList label="Orders">
            {rows.map((o) => (
              <CardItem key={o.id} className="p-0">
                <Link href={`/admin/orders/${o.id}`} className="block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[13px] font-medium">{o.orderNumber}</p>
                      <p className="truncate text-xs text-muted">{formatDateTime(o.placedAt)}</p>
                    </div>
                    <span className="num shrink-0 text-sm font-semibold">{formatPrice(o.total)}</span>
                  </div>
                  <p className="mt-2 truncate text-sm">{o.customerName}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <OrderStatusBadge status={o.status} />
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </div>
                </Link>
              </CardItem>
            ))}
          </CardList>

          <AdminPagination info={info} basePath="/admin/orders" searchParams={sp} noun="orders" />
        </>
      )}
    </>
  );
}
