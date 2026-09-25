import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export const STOCK_LEVELS = ["in", "low", "out"] as const;
export type StockFilter = (typeof STOCK_LEVELS)[number];

/**
 * "available = quantity − reserved" can't be expressed in a Prisma `where`, so stock
 * filters resolve to product ids with a small SQL query. Products without an
 * Inventory row count as out of stock. Archived products are ignored.
 */
function stockCondition(level: StockFilter) {
  const available = Prisma.sql`(COALESCE(i."quantity", 0) - COALESCE(i."reserved", 0))`;
  if (level === "out") return Prisma.sql`${available} <= 0`;
  if (level === "low") return Prisma.sql`${available} > 0 AND ${available} <= COALESCE(i."lowStockThreshold", 3)`;
  return Prisma.sql`${available} > COALESCE(i."lowStockThreshold", 3)`;
}

export async function productIdsWithStock(level: StockFilter): Promise<string[]> {
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT p."id" FROM "Product" p
    LEFT JOIN "Inventory" i ON i."productId" = p."id"
    WHERE p."status" <> 'ARCHIVED' AND ${stockCondition(level)}`;
  return rows.map((r) => r.id);
}

export async function stockCounts() {
  const [row] = await db.$queryRaw<{ low: bigint; out: bigint }[]>`
    SELECT
      COUNT(*) FILTER (WHERE ${stockCondition("low")}) AS "low",
      COUNT(*) FILTER (WHERE ${stockCondition("out")}) AS "out"
    FROM "Product" p
    LEFT JOIN "Inventory" i ON i."productId" = p."id"
    WHERE p."status" <> 'ARCHIVED'`;
  return { low: Number(row?.low ?? 0), out: Number(row?.out ?? 0) };
}

export async function lowStockList(limit = 8) {
  return db.$queryRaw<{ id: string; name: string; sku: string; available: number; threshold: number }[]>`
    SELECT p."id", p."name", p."sku",
           (COALESCE(i."quantity", 0) - COALESCE(i."reserved", 0))::int AS "available",
           COALESCE(i."lowStockThreshold", 3)::int AS "threshold"
    FROM "Product" p
    LEFT JOIN "Inventory" i ON i."productId" = p."id"
    WHERE p."status" = 'PUBLISHED' AND ${stockCondition("low")}
    ORDER BY "available" ASC, p."name" ASC
    LIMIT ${limit}`;
}
