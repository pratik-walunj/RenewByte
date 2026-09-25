"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { cleanText } from "@/lib/security";
import { rupeesToPaise } from "@/lib/format";
import { authorize, failure, invalid, isUniqueViolation } from "@/server/admin/guard";
import { fromDateInput } from "@/server/admin/dates";
import { couponSchema } from "@/server/admin/schemas/coupon";
import type { ActionResult } from "@/server/admin/types";

const idSchema = z.string().min(1).max(64);

export async function saveCoupon(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await authorize();
  if (!user) return denied;
  if (id !== null && !idSchema.safeParse(id).success) return { ok: false, error: "Invalid coupon." };
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const data = {
    code: v.code.toUpperCase(),
    description: v.description ? cleanText(v.description, 200) : null,
    type: v.type,
    value: v.type === "FIXED" ? rupeesToPaise(v.value) : Math.round(v.value),
    minOrderValue: rupeesToPaise(v.minOrderRupees),
    maxDiscount: v.type === "PERCENTAGE" && v.maxDiscountRupees !== null ? rupeesToPaise(v.maxDiscountRupees) : null,
    startsAt: v.startsAt ? fromDateInput(v.startsAt, "start") : null,
    expiresAt: v.expiresAt ? fromDateInput(v.expiresAt, "end") : null,
    usageLimit: v.usageLimit,
    perUserLimit: v.perUserLimit,
    isActive: v.isActive,
  };
  const products = [...new Set(v.productIds)].map((pid) => ({ id: pid }));
  const categories = [...new Set(v.categoryIds)].map((cid) => ({ id: cid }));

  try {
    const coupon =
      id === null
        ? await db.coupon.create({ data: { ...data, products: { connect: products }, categories: { connect: categories } } })
        : await db.coupon.update({
            where: { id },
            data: { ...data, products: { set: products }, categories: { set: categories } },
          });
    revalidatePath("/admin/coupons");
    return { ok: true, id: coupon.id, message: id === null ? "Coupon created" : "Coupon saved" };
  } catch (e) {
    if (isUniqueViolation(e, "code")) {
      return { ok: false, error: "That code already exists.", fieldErrors: { code: ["This code is already in use."] } };
    }
    return failure("saveCoupon", e, "The coupon couldn't be saved. Check the selected products and categories still exist.");
  }
}

export async function setCouponActive(id: string, active: boolean): Promise<ActionResult> {
  const { user, denied } = await authorize();
  if (!user) return denied;
  if (!idSchema.safeParse(id).success || typeof active !== "boolean") return { ok: false, error: "Invalid request." };
  try {
    await db.coupon.update({ where: { id }, data: { isActive: active } });
    revalidatePath("/admin/coupons");
    return { ok: true, message: active ? "Coupon activated" : "Coupon paused" };
  } catch (e) {
    return failure("setCouponActive", e);
  }
}

/** ADMIN only. Coupons that have been redeemed are deactivated instead, keeping redemption history. */
export async function deleteCoupon(id: string): Promise<ActionResult> {
  const { user, denied } = await authorize("ADMIN");
  if (!user) return denied;
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid coupon." };
  const coupon = await db.coupon.findUnique({ where: { id }, select: { _count: { select: { redemptions: true, orders: true } } } });
  if (!coupon) return { ok: false, error: "This coupon no longer exists." };
  try {
    if (coupon._count.redemptions > 0 || coupon._count.orders > 0) {
      await db.coupon.update({ where: { id }, data: { isActive: false } });
      revalidatePath("/admin/coupons");
      return { ok: true, message: "This coupon has been used, so it was deactivated instead of deleted." };
    }
    await db.coupon.delete({ where: { id } });
    revalidatePath("/admin/coupons");
    return { ok: true, message: "Coupon deleted" };
  } catch (e) {
    return failure("deleteCoupon", e);
  }
}
