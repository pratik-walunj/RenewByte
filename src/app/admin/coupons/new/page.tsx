import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/session";
import { getCouponTargets } from "@/server/admin/coupons";
import { EMPTY_COUPON } from "@/server/admin/schemas/coupon";
import { AdminPageHeader } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/coupons/coupon-form";

export const metadata: Metadata = { title: "New coupon" };

export default async function NewCouponPage() {
  await requireStaff();
  const targets = await getCouponTargets();
  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader back={{ href: "/admin/coupons", label: "Coupons" }} title="New coupon" />
      <CouponForm couponId={null} initial={EMPTY_COUPON} products={targets.products} categories={targets.categories} />
    </div>
  );
}
