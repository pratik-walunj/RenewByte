import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { digitsOnly } from "@/lib/utils";
import { ADMIN_PAGE_SIZE, pageInfo } from "@/server/admin/pagination";

export const OPEN_STATUSES: OrderStatus[] = ["PENDING", "PAYMENT_PROCESSING", "PAID", "PROCESSING"];

export async function listOrders(f: { q: string; status: OrderStatus | "open" | ""; page: number }) {
  const where: Prisma.OrderWhereInput = {};
  if (f.status === "open") where.status = { in: OPEN_STATUSES };
  else if (f.status) where.status = f.status;
  if (f.q) {
    const digits = digitsOnly(f.q);
    where.OR = [
      { orderNumber: { contains: f.q, mode: "insensitive" } },
      { email: { contains: f.q, mode: "insensitive" } },
      { customerName: { contains: f.q, mode: "insensitive" } },
      ...(digits.length >= 4 ? [{ phone: { contains: digits.slice(-10) } }] : []),
    ];
  }
  const total = await db.order.count({ where });
  const info = pageInfo(total, f.page);
  const rows = await db.order.findMany({
    where,
    orderBy: { placedAt: "desc" },
    skip: (info.page - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      email: true,
      phone: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      total: true,
      placedAt: true,
      _count: { select: { items: true } },
    },
  });
  return { rows, info };
}

export async function getAdminOrder(id: string) {
  return db.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export type AdminOrder = NonNullable<Awaited<ReturnType<typeof getAdminOrder>>>;

/** Shape of the JSON address snapshot stored on each order. */
export type AddressSnapshot = {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  landmark?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
};

export function readAddress(value: Prisma.JsonValue): AddressSnapshot {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AddressSnapshot) : {};
}
