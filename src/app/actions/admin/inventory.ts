"use server";

import { db } from "@/lib/db";
import { invalidateCatalog } from "@/lib/cache";
import { cleanText } from "@/lib/security";
import { authorize, failure, invalid } from "@/server/admin/guard";
import { adjustStockSchema } from "@/server/admin/schemas/inventory";
import type { ActionResult } from "@/server/admin/types";

class StockError extends Error {}

/** Set stock to a value, or apply a +/- delta. Every quantity change is logged with the user and reason. */
export async function adjustStock(input: unknown): Promise<ActionResult<{ quantity: number }>> {
  const { user, denied } = await authorize();
  if (!user) return denied;
  const parsed = adjustStockSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  if (v.mode === "set" && v.amount < 0) {
    return { ok: false, error: "Quantity can't be negative.", fieldErrors: { amount: ["Quantity can't be negative."] } };
  }

  try {
    const quantity = await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: v.productId }, select: { id: true } });
      if (!product) throw new StockError("This product no longer exists.");
      const inv = await tx.inventory.upsert({
        where: { productId: v.productId },
        create: { productId: v.productId, quantity: 0, lowStockThreshold: v.lowStockThreshold },
        update: {},
      });
      const next = v.mode === "set" ? v.amount : inv.quantity + v.amount;
      if (next < 0) throw new StockError(`That would leave ${next} units. There are only ${inv.quantity} on hand.`);
      if (next < inv.reserved) {
        throw new StockError(`${inv.reserved} units are reserved for unpaid orders, so quantity can't go below ${inv.reserved}.`);
      }
      const change = next - inv.quantity;
      await tx.inventory.update({
        where: { id: inv.id },
        data: { quantity: next, lowStockThreshold: v.lowStockThreshold },
      });
      if (change !== 0) {
        await tx.inventoryAdjustment.create({
          data: { inventoryId: inv.id, change, reason: cleanText(v.reason, 200), userId: user.id },
        });
      }
      return next;
    });
    invalidateCatalog();
    return { ok: true, quantity, message: `Stock updated to ${quantity}` };
  } catch (e) {
    if (e instanceof StockError) return { ok: false, error: e.message, fieldErrors: { amount: [e.message] } };
    return failure("adjustStock", e);
  }
}
