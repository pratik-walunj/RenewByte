import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { getCustomer } from "@/server/admin/customers";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, Meta, Panel } from "@/components/admin/ui";
import { OrderStatusBadge } from "@/components/admin/badges";
import { AccountControls } from "@/components/admin/customers/account-controls";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = await getCustomer(id);
  return { title: c ? c.name : "Customer not found" };
}

export default async function CustomerPage({ params }: Props) {
  const viewer = await requireStaff();
  const { id } = await params;
  const c = await getCustomer(id);
  if (!c) notFound();
  const isSelf = viewer.id === c.id;

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/customers", label: "Customers" }}
        eyebrow={c.role === "CUSTOMER" ? "Customer" : c.role === "ADMIN" ? "Administrator" : "Staff"}
        title={c.name}
        description={
          <span className="flex flex-wrap items-center gap-2 text-[13px]">
            {!c.isActive && <Badge tone="danger">Deactivated</Badge>}
            Joined {formatDate(c.createdAt)}
            {c.lastLoginAt && <> · Last sign-in {formatDateTime(c.lastLoginAt)}</>}
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel id="orders" title={`Orders (${c._count.orders})`} bodyClassName="p-0 sm:p-0">
            {c.orders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {c.orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 hover:bg-subtle sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[13px] font-medium">{o.orderNumber}</p>
                        <p className="text-xs text-muted">{formatDateTime(o.placedAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <OrderStatusBadge status={o.status} />
                        <span className="num text-sm font-medium">{formatPrice(o.total)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel id="addresses" title="Saved addresses">
            {c.addresses.length === 0 ? (
              <p className="text-sm text-muted">No saved addresses.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {c.addresses.map((a) => (
                  <li key={a.id} className="rounded-lg border border-border p-3 text-sm">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {a.label || a.fullName}
                      {a.isDefault && <Badge tone="info">Default</Badge>}
                    </p>
                    <address className="mt-1 leading-relaxed text-muted not-italic">
                      {a.fullName}
                      <br />
                      {a.line1}
                      {a.line2 && (
                        <>
                          <br />
                          {a.line2}
                        </>
                      )}
                      <br />
                      {a.city}, {a.state} {a.pincode}
                      <br />
                      {a.phone}
                    </address>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel id="profile" title="Profile">
            <dl className="flex flex-col gap-1.5">
              <Meta label="Email">
                <a href={`mailto:${c.email}`} className="break-all hover:underline">
                  {c.email}
                </a>
              </Meta>
              <Meta label="Phone">{c.phone ?? "—"}</Meta>
              <Meta label="Lifetime value">
                <span className="num font-medium">{formatPrice(c.lifetimeValue)}</span>
              </Meta>
              <Meta label="Reviews">{c._count.reviews}</Meta>
              <Meta label="Wishlist items">{c._count.wishlist}</Meta>
            </dl>
          </Panel>

          {viewer.role === "ADMIN" && (
            <Panel id="access" title="Access">
              {isSelf ? (
                <p className="text-sm text-muted">This is your account. Another administrator must change your role or status.</p>
              ) : (
                <AccountControls userId={c.id} name={c.name} role={c.role} isActive={c.isActive} />
              )}
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
