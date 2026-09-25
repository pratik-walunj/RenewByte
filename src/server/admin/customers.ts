import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { ADMIN_PAGE_SIZE, pageInfo } from "@/server/admin/pagination";
import { SALES_WHERE } from "@/server/admin/dashboard";

export async function listCustomers(f: { q: string; role: Role | ""; page: number }) {
  const where: Prisma.UserWhereInput = {};
  if (f.role) where.role = f.role;
  if (f.q) {
    where.OR = [
      { name: { contains: f.q, mode: "insensitive" } },
      { email: { contains: f.q, mode: "insensitive" } },
      { phone: { contains: f.q } },
    ];
  }
  const total = await db.user.count({ where });
  const info = pageInfo(total, f.page);
  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (info.page - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });
  const ltv = await db.order.groupBy({
    by: ["userId"],
    where: { ...SALES_WHERE, userId: { in: users.map((u) => u.id) } },
    _sum: { total: true },
  });
  const ltvMap = new Map(ltv.map((r) => [r.userId, r._sum.total ?? 0]));
  return { info, rows: users.map((u) => ({ ...u, lifetimeValue: ltvMap.get(u.id) ?? 0 })) };
}

export async function getCustomer(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      orders: {
        orderBy: { placedAt: "desc" },
        take: 50,
        select: { id: true, orderNumber: true, status: true, paymentStatus: true, total: true, placedAt: true },
      },
      _count: { select: { orders: true, reviews: true, wishlist: true } },
    },
  });
  if (!user) return null;
  const ltv = await db.order.aggregate({ where: { ...SALES_WHERE, userId: id }, _sum: { total: true } });
  return { ...user, lifetimeValue: ltv._sum.total ?? 0 };
}
