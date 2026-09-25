import "server-only";
import { db } from "@/lib/db";
import { paiseToRupees } from "@/lib/format";
import { toDateInput } from "@/server/admin/dates";
import type { CouponFormValues } from "@/server/admin/schemas/coupon";

export async function listCoupons() {
  return db.coupon.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { products: true, categories: true } } },
  });
}

export type AdminCoupon = Awaited<ReturnType<typeof listCoupons>>[number];

export async function getCouponForEdit(id: string) {
  const c = await db.coupon.findUnique({
    where: { id },
    include: { products: { select: { id: true } }, categories: { select: { id: true } } },
  });
  if (!c) return null;
  const values: CouponFormValues = {
    code: c.code,
    description: c.description ?? "",
    type: c.type,
    value: c.type === "FIXED" ? paiseToRupees(c.value) : c.value,
    minOrderRupees: paiseToRupees(c.minOrderValue),
    maxDiscountRupees: c.maxDiscount === null ? null : paiseToRupees(c.maxDiscount),
    startsAt: toDateInput(c.startsAt),
    expiresAt: toDateInput(c.expiresAt),
    usageLimit: c.usageLimit,
    perUserLimit: c.perUserLimit,
    isActive: c.isActive,
    productIds: c.products.map((p) => p.id),
    categoryIds: c.categories.map((x) => x.id),
  };
  return { values, meta: { id: c.id, code: c.code, usedCount: c.usedCount } };
}

/** Options for the "applies to" pickers. */
export async function getCouponTargets() {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { name: "asc" },
      take: 500,
      select: { id: true, name: true, sku: true },
    }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  return {
    products: products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })),
    categories: categories.map((c) => ({ value: c.id, label: c.name })),
  };
}
