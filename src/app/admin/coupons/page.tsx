import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, TicketPercent } from "lucide-react";
import { getStaffUser } from "@/lib/auth/session";
import { formatDate, formatPrice } from "@/lib/format";
import { listCoupons, type AdminCoupon } from "@/server/admin/coupons";
import { deleteCoupon, setCouponActive } from "@/app/actions/admin/coupons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { AdminPageHeader, CardItem, CardList, DataTable, Meta, td, th } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { ConfirmButton } from "@/components/admin/confirm-dialog";

export const metadata: Metadata = { title: "Coupons" };

function discountLabel(c: AdminCoupon) {
  if (c.type === "FIXED") return `${formatPrice(c.value)} off`;
  return `${c.value}% off${c.maxDiscount ? ` (max ${formatPrice(c.maxDiscount)})` : ""}`;
}

function state(c: AdminCoupon): { label: string; tone: "success" | "neutral" | "warning" | "danger" } {
  const now = new Date();
  if (!c.isActive) return { label: "Paused", tone: "neutral" };
  if (c.expiresAt && c.expiresAt < now) return { label: "Expired", tone: "danger" };
  if (c.startsAt && c.startsAt > now) return { label: "Scheduled", tone: "warning" };
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return { label: "Used up", tone: "danger" };
  return { label: "Active", tone: "success" };
}

function scope(c: AdminCoupon) {
  const parts = [];
  if (c._count.categories) parts.push(`${c._count.categories} categor${c._count.categories === 1 ? "y" : "ies"}`);
  if (c._count.products) parts.push(`${c._count.products} product${c._count.products === 1 ? "" : "s"}`);
  return parts.length ? parts.join(", ") : "Whole cart";
}

function validity(c: AdminCoupon) {
  if (!c.startsAt && !c.expiresAt) return "No end date";
  return `${c.startsAt ? formatDate(c.startsAt) : "Now"} – ${c.expiresAt ? formatDate(c.expiresAt) : "no end"}`;
}

function Actions({ c, canDelete }: { c: AdminCoupon; canDelete: boolean }) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <Button asChild variant="outline" size="sm">
        <Link href={`/admin/coupons/${c.id}`} aria-label={`Edit ${c.code}`}>
          <Pencil /> Edit
        </Link>
      </Button>
      <ActionButton action={setCouponActive.bind(null, c.id, !c.isActive)}>{c.isActive ? "Pause" : "Activate"}</ActionButton>
      {canDelete && (
        <ConfirmButton
          buttonProps={{ variant: "ghost", className: "text-sale" }}
          title={`Delete ${c.code}?`}
          description="Unused coupons are deleted permanently. Coupons that have been redeemed are deactivated instead so order history stays accurate."
          confirmLabel="Delete coupon"
          action={deleteCoupon.bind(null, c.id)}
        >
          Delete
        </ConfirmButton>
      )}
    </div>
  );
}

export default async function CouponsPage() {
  const [coupons, user] = await Promise.all([listCoupons(), getStaffUser()]);
  const canDelete = user?.role === "ADMIN";

  return (
    <>
      <AdminPageHeader
        eyebrow="Promotions"
        title="Coupons"
        description="Discount codes customers can apply at checkout."
        actions={
          <Button asChild>
            <Link href="/admin/coupons/new">
              <Plus /> New coupon
            </Link>
          </Button>
        }
      />

      {coupons.length === 0 ? (
        <EmptyState icon={<TicketPercent />} title="No coupons yet" description="Create a code to run a promotion.">
          <Button asChild>
            <Link href="/admin/coupons/new">New coupon</Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          <DataTable caption="Coupons">
            <thead className="border-b border-border bg-subtle/60">
              <tr>
                <th scope="col" className={th}>Code</th>
                <th scope="col" className={th}>Discount</th>
                <th scope="col" className={th}>Applies to</th>
                <th scope="col" className={th}>Validity</th>
                <th scope="col" className={`${th} text-right`}>Used</th>
                <th scope="col" className={th}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map((c) => {
                const s = state(c);
                return (
                  <tr key={c.id} className="hover:bg-subtle/40">
                    <td className={td}>
                      <p className="font-mono text-[13px] font-semibold">{c.code}</p>
                      <Badge tone={s.tone} className="mt-1">{s.label}</Badge>
                    </td>
                    <td className={td}>
                      <p>{discountLabel(c)}</p>
                      {c.minOrderValue > 0 && <p className="text-xs text-muted">Min. order {formatPrice(c.minOrderValue)}</p>}
                    </td>
                    <td className={`${td} text-muted`}>{scope(c)}</td>
                    <td className={`${td} text-xs whitespace-nowrap text-muted`}>{validity(c)}</td>
                    <td className={`${td} num text-right`}>
                      {c.usedCount}
                      {c.usageLimit !== null && <span className="text-muted"> / {c.usageLimit}</span>}
                    </td>
                    <td className={td}>
                      <Actions c={c} canDelete={canDelete} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>

          <CardList label="Coupons">
            {coupons.map((c) => {
              const s = state(c);
              return (
                <CardItem key={c.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-mono text-sm font-semibold">{c.code}</p>
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </div>
                  <dl className="mt-3 flex flex-col gap-1">
                    <Meta label="Discount">{discountLabel(c)}</Meta>
                    <Meta label="Applies to">{scope(c)}</Meta>
                    <Meta label="Validity">{validity(c)}</Meta>
                    <Meta label="Used">
                      <span className="num">
                        {c.usedCount}
                        {c.usageLimit !== null && ` / ${c.usageLimit}`}
                      </span>
                    </Meta>
                  </dl>
                  <div className="mt-3">
                    <Actions c={c} canDelete={canDelete} />
                  </div>
                </CardItem>
              );
            })}
          </CardList>
        </>
      )}
    </>
  );
}
