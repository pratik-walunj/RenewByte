import type { Metadata } from "next";
import Link from "next/link";
import { formatCompactPrice, formatDateTime, formatNumber, formatPrice } from "@/lib/format";
import {
  getDailySeries,
  getDashboardKpis,
  getRecentOrders,
  getSalesByBrand,
  lowStockList,
} from "@/server/admin/dashboard";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { KpiTile } from "@/components/admin/kpi-tile";
import { ColumnChart } from "@/components/admin/charts/column-chart";
import { BarList } from "@/components/admin/charts/bar-list";
import { OrderStatusBadge, StockBadge } from "@/components/admin/badges";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [kpis, series, brands, recent, lowStock] = await Promise.all([
    getDashboardKpis(),
    getDailySeries(),
    getSalesByBrand(),
    getRecentOrders(),
    lowStockList(),
  ]);

  return (
    <>
      <AdminPageHeader eyebrow="Overview" title="Dashboard" description="Store performance and what needs attention today." />

      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Total sales" value={formatCompactPrice(kpis.totalSales)} hint={formatPrice(kpis.totalSales)} />
        <KpiTile label="Orders" value={formatNumber(kpis.orders)} href="/admin/orders" />
        <KpiTile
          label="Pending orders"
          value={formatNumber(kpis.pending)}
          hint="Awaiting fulfilment"
          href="/admin/orders?status=open"
          tone={kpis.pending ? "warning" : "default"}
        />
        <KpiTile label="Customers" value={formatNumber(kpis.customers)} href="/admin/customers" />
        <KpiTile label="Published products" value={formatNumber(kpis.published)} href="/admin/products?status=PUBLISHED" />
        <KpiTile
          label="Low stock"
          value={formatNumber(kpis.lowStock)}
          href="/admin/inventory?stock=low"
          tone={kpis.lowStock ? "warning" : "default"}
        />
        <KpiTile
          label="Out of stock"
          value={formatNumber(kpis.outOfStock)}
          href="/admin/inventory?stock=out"
          tone={kpis.outOfStock ? "danger" : "default"}
        />
        <KpiTile label="Sales, last 30 days" value={formatCompactPrice(series.totalRevenue)} hint={`${series.totalOrders} orders placed`} />
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel id="revenue" title="Revenue per day" description="Last 30 days · captured payments and delivered COD">
          <ColumnChart data={series.revenue} format="currency" label="Revenue per day" summary={series.revenueSummary} />
        </Panel>
        <Panel id="orders-per-day" title="Orders per day" description="Last 30 days · all orders placed">
          <ColumnChart data={series.orders} format="number" label="Orders per day" summary={series.ordersSummary} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel id="brands" title="Sales by brand" description="Last 30 days">
          <BarList items={brands} format="currency" label="Sales by brand, last 30 days" />
        </Panel>

        <Panel
          id="recent"
          title="Recent orders"
          className="lg:col-span-2"
          bodyClassName="p-0 sm:p-0"
          action={
            <Link href="/admin/orders" className="text-sm font-medium text-accent hover:underline">
              View all
            </Link>
          }
        >
          {recent.length ? (
            <ul className="divide-y divide-border">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 hover:bg-subtle sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[13px] font-medium">{o.orderNumber}</p>
                      <p className="truncate text-xs text-muted">
                        {o.customerName} · {formatDateTime(o.placedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={o.status} />
                      <span className="num text-sm font-medium">{formatPrice(o.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted">No orders yet.</p>
          )}
        </Panel>
      </div>

      <Panel
        id="low-stock"
        title="Low stock"
        description="Published products at or below their threshold"
        className="mt-4"
        bodyClassName="p-0 sm:p-0"
        action={
          <Link href="/admin/inventory?stock=low" className="text-sm font-medium text-accent hover:underline">
            Manage inventory
          </Link>
        }
      >
        {lowStock.length ? (
          <ul className="divide-y divide-border">
            {lowStock.map((p) => (
              <li key={p.id} className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <Link href={`/admin/products/${p.id}`} className="block truncate text-sm font-medium hover:underline">
                    {p.name}
                  </Link>
                  <p className="truncate font-mono text-xs text-muted">{p.sku}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="num text-sm">
                    {p.available} left <span className="text-muted">/ {p.threshold}</span>
                  </span>
                  <StockBadge level="low" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted">Nothing is running low.</p>
        )}
      </Panel>
    </>
  );
}
