import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { getCouponForEdit, getCouponTargets } from "@/server/admin/coupons";
import { AdminPageHeader } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/coupons/coupon-form";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = await getCouponForEdit(id);
  return { title: c ? `Coupon ${c.meta.code}` : "Coupon not found" };
}

export default async function EditCouponPage({ params }: Props) {
  await requireStaff();
  const { id } = await params;
  const [coupon, targets] = await Promise.all([getCouponForEdit(id), getCouponTargets()]);
  if (!coupon) notFound();
  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        back={{ href: "/admin/coupons", label: "Coupons" }}
        eyebrow="Coupon"
        title={coupon.meta.code}
        description={`Redeemed ${coupon.meta.usedCount} ${coupon.meta.usedCount === 1 ? "time" : "times"}.`}
      />
      <CouponForm couponId={coupon.meta.id} initial={coupon.values} products={targets.products} categories={targets.categories} />
    </div>
  );
}
