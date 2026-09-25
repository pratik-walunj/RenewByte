import "server-only";
import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;
type Line = { productId: string | null; quantity: number };

export class OutOfStockError extends Error {
  constructor(public productName: string) {
    super(`Sorry, ${productName} just went out of stock.`);
  }
}

/**
 * Reserve stock for an unpaid online order. Uses a conditional UPDATE so two
 * concurrent checkouts can never oversell the same unit.
 */
export async function reserveStock(tx: Tx, lines: (Line & { name: string })[]) {
  for (const line of lines) {
    if (!line.productId) continue;
    const updated = await tx.$executeRaw`
      UPDATE "Inventory"
         SET "reserved" = "reserved" + ${line.quantity}, "updatedAt" = NOW()
       WHERE "productId" = ${line.productId}
         AND "quantity" - "reserved" >= ${line.quantity}`;
    if (updated !== 1) throw new OutOfStockError(line.name);
  }
}

/** Convert a reservation into a sale (payment captured). */
export async function commitReservedStock(tx: Tx, orderId: string, lines: Line[]) {
  for (const line of lines) {
    if (!line.productId) continue;
    const inv = await tx.inventory.update({
      where: { productId: line.productId },
      data: { quantity: { decrement: line.quantity }, reserved: { decrement: line.quantity } },
    });
    await tx.inventoryAdjustment.create({
      data: { inventoryId: inv.id, change: -line.quantity, reason: "Sale (online payment)", orderId },
    });
    await tx.product.update({ where: { id: line.productId }, data: { soldCount: { increment: line.quantity } } });
  }
}

/** Deduct stock directly (cash on delivery). */
export async function deductStock(tx: Tx, orderId: string, lines: (Line & { name: string })[]) {
  for (const line of lines) {
    if (!line.productId) continue;
    const updated = await tx.$executeRaw`
      UPDATE "Inventory"
         SET "quantity" = "quantity" - ${line.quantity}, "updatedAt" = NOW()
       WHERE "productId" = ${line.productId}
         AND "quantity" - "reserved" >= ${line.quantity}`;
    if (updated !== 1) throw new OutOfStockError(line.name);
    const inv = await tx.inventory.findUniqueOrThrow({ where: { productId: line.productId }, select: { id: true } });
    await tx.inventoryAdjustment.create({
      data: { inventoryId: inv.id, change: -line.quantity, reason: "Sale (cash on delivery)", orderId },
    });
    await tx.product.update({ where: { id: line.productId }, data: { soldCount: { increment: line.quantity } } });
  }
}

/** Release a reservation (payment failed / abandoned / cancelled before payment). */
export async function releaseReservedStock(tx: Tx, lines: Line[]) {
  for (const line of lines) {
    if (!line.productId) continue;
    await tx.$executeRaw`
      UPDATE "Inventory"
         SET "reserved" = GREATEST(0, "reserved" - ${line.quantity}), "updatedAt" = NOW()
       WHERE "productId" = ${line.productId}`;
  }
}

/** Return sold units to stock (cancellation or refund after the sale was committed). */
export async function restock(tx: Tx, orderId: string, lines: Line[], reason: string, userId?: string) {
  for (const line of lines) {
    if (!line.productId) continue;
    const inv = await tx.inventory.update({
      where: { productId: line.productId },
      data: { quantity: { increment: line.quantity } },
    });
    await tx.inventoryAdjustment.create({
      data: { inventoryId: inv.id, change: line.quantity, reason, orderId, userId },
    });
    await tx.product.update({ where: { id: line.productId }, data: { soldCount: { decrement: line.quantity } } });
  }
}
