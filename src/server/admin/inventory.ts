import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ADMIN_PAGE_SIZE, pageInfo } from "@/server/admin/pagination";
import { productIdsWithStock, type StockFilter } from "@/server/admin/stock";

export async function listInventory(f: { q: string; stock: StockFilter | ""; page: number }) {
  const where: Prisma.ProductWhereInput = { status: { not: "ARCHIVED" } };
  if (f.q) {
    where.OR = [
      { name: { contains: f.q, mode: "insensitive" } },
      { sku: { contains: f.q, mode: "insensitive" } },
    ];
  }
  if (f.stock) where.id = { in: await productIdsWithStock(f.stock) };

  const total = await db.product.count({ where });
  const info = pageInfo(total, f.page);
  const rows = await db.product.findMany({
    where,
    orderBy: [{ inventory: { quantity: "asc" } }, { name: "asc" }],
    skip: (info.page - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      sku: true,
      status: true,
      inventory: { select: { quantity: true, reserved: true, lowStockThreshold: true, updatedAt: true } },
    },
  });
  return {
    info,
    rows: rows.map((r) => {
      const quantity = r.inventory?.quantity ?? 0;
      const reserved = r.inventory?.reserved ?? 0;
      return {
        id: r.id,
        name: r.name,
        sku: r.sku,
        status: r.status,
        quantity,
        reserved,
        available: Math.max(0, quantity - reserved),
        threshold: r.inventory?.lowStockThreshold ?? 3,
        updatedAt: r.inventory?.updatedAt ?? null,
      };
    }),
  };
}

export type InventoryRow = Awaited<ReturnType<typeof listInventory>>["rows"][number];

export async function recentAdjustments(take = 15) {
  return db.inventoryAdjustment.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      change: true,
      reason: true,
      orderId: true,
      createdAt: true,
      user: { select: { name: true } },
      inventory: { select: { product: { select: { id: true, name: true, sku: true } } } },
    },
  });
}
