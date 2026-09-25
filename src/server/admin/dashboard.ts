import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { lowStockList, stockCounts } from "@/server/admin/stock";

const DAYS = 30;
const TZ = "Asia/Kolkata";

/** Revenue-recognised orders: captured payments, or delivered COD; never cancelled/refunded. */
export const SALES_WHERE: Prisma.OrderWhereInput = {
  status: { notIn: ["CANCELLED", "REFUNDED"] },
  OR: [{ paymentStatus: "CAPTURED" }, { paymentMethod: "COD", status: "DELIVERED" }],
};

const PENDING_STATUSES = ["PENDING", "PAYMENT_PROCESSING", "PAID", "PROCESSING"] as const;

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const dayShort = new Intl.DateTimeFormat("en-IN", { timeZone: TZ, day: "numeric", month: "short" });
const dayLong = new Intl.DateTimeFormat("en-IN", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });

export async function getDashboardKpis() {
  const [sales, orders, customers, published, pending, stock] = await Promise.all([
    db.order.aggregate({ where: SALES_WHERE, _sum: { total: true } }),
    db.order.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count({ where: { status: "PUBLISHED" } }),
    db.order.count({ where: { status: { in: [...PENDING_STATUSES] } } }),
    stockCounts(),
  ]);
  return {
    totalSales: sales._sum.total ?? 0,
    orders,
    customers,
    published,
    pending,
    lowStock: stock.low,
    outOfStock: stock.out,
  };
}

/** Daily revenue and order counts for the last 30 days (IST calendar days, oldest first). */
export async function getDailySeries() {
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const orders = await db.order.findMany({
    where: { placedAt: { gte: since } },
    select: { placedAt: true, total: true, status: true, paymentStatus: true, paymentMethod: true },
  });

  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(Date.now() - (DAYS - 1 - i) * 24 * 60 * 60 * 1000);
    return { key: dayKey.format(d), label: dayShort.format(d), fullLabel: dayLong.format(d), revenue: 0, orders: 0 };
  });
  const index = new Map(days.map((d, i) => [d.key, i]));

  for (const o of orders) {
    const i = index.get(dayKey.format(o.placedAt));
    if (i === undefined) continue;
    days[i].orders += 1;
    const recognised =
      o.status !== "CANCELLED" &&
      o.status !== "REFUNDED" &&
      (o.paymentStatus === "CAPTURED" || (o.paymentMethod === "COD" && o.status === "DELIVERED"));
    if (recognised) days[i].revenue += o.total;
  }

  const totalRevenue = days.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = days.reduce((s, d) => s + d.orders, 0);
  const bestRevenue = days.reduce((a, b) => (b.revenue > a.revenue ? b : a), days[0]);
  const bestOrders = days.reduce((a, b) => (b.orders > a.orders ? b : a), days[0]);

  return {
    revenue: days.map((d) => ({ key: d.key, label: d.label, fullLabel: d.fullLabel, value: d.revenue })),
    orders: days.map((d) => ({ key: d.key, label: d.label, fullLabel: d.fullLabel, value: d.orders })),
    revenueSummary: totalRevenue
      ? `${formatPrice(totalRevenue)} in recognised sales over the last ${DAYS} days; the best day was ${bestRevenue.fullLabel} at ${formatPrice(bestRevenue.revenue)}.`
      : `No recognised sales in the last ${DAYS} days.`,
    ordersSummary: totalOrders
      ? `${totalOrders} orders placed over the last ${DAYS} days; the busiest day was ${bestOrders.fullLabel} with ${bestOrders.orders}.`
      : `No orders placed in the last ${DAYS} days.`,
    totalRevenue,
    totalOrders,
  };
}

/** Recognised sales by brand over the last 30 days (top 6). */
export async function getSalesByBrand() {
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const items = await db.orderItem.findMany({
    where: { order: { ...SALES_WHERE, placedAt: { gte: since } } },
    select: { total: true, quantity: true, product: { select: { brand: { select: { name: true } } } } },
  });
  const byBrand = new Map<string, { value: number; units: number }>();
  for (const item of items) {
    const name = item.product?.brand.name ?? "Deleted products";
    const row = byBrand.get(name) ?? { value: 0, units: 0 };
    row.value += item.total;
    row.units += item.quantity;
    byBrand.set(name, row);
  }
  return [...byBrand.entries()]
    .map(([label, r]) => ({ label, value: r.value, note: `${r.units} ${r.units === 1 ? "unit" : "units"}` }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export async function getRecentOrders(take = 6) {
  return db.order.findMany({
    orderBy: { placedAt: "desc" },
    take,
    select: { id: true, orderNumber: true, customerName: true, total: true, status: true, placedAt: true },
  });
}

export { lowStockList };
