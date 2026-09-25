import type { Metadata } from "next";
import { CheckCircle2, CircleSlash, Trash2 } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/cms";
import { formatPrice } from "@/lib/format";
import { getSettingsForm, integrationStatus, listShippingZones } from "@/server/admin/settings";
import { deleteShippingZone } from "@/app/actions/admin/settings";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-dialog";
import { StoreSettingsForm } from "@/components/admin/settings/store-settings-form";
import { ZoneDialog } from "@/components/admin/settings/zone-dialog";
import { BusinessCard } from "@/components/admin/settings/business-card";

export const metadata: Metadata = { title: "Settings" };

function Status({ label, ok, note }: { label: string; ok: boolean; note: string }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{note}</p>
      </div>
      {ok ? (
        <Badge tone="success">
          <CheckCircle2 aria-hidden /> Configured
        </Badge>
      ) : (
        <Badge tone="neutral">
          <CircleSlash aria-hidden /> Not set
        </Badge>
      )}
    </li>
  );
}

export default async function SettingsPage() {
  const user = await requireStaff();
  const canEdit = user.role === "ADMIN";
  const [values, zones, site] = await Promise.all([getSettingsForm(), listShippingZones(), getSiteSettings()]);
  const env = integrationStatus();

  return (
    <>
      <AdminPageHeader
        eyebrow="Configuration"
        title="Settings"
        description={canEdit ? "Commerce rules for tax, shipping and payments." : "You can view settings; only administrators can change them."}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <StoreSettingsForm initial={values} canEdit={canEdit} />

        <div className="flex min-w-0 flex-col gap-4">
          <Panel id="integrations" title="Integrations" description="Read from environment variables. Secrets are never shown.">
            <ul className="-my-2.5 divide-y divide-border">
              <Status label="Razorpay" ok={env.razorpay} note="RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET" />
              <Status label="Razorpay webhook" ok={env.razorpayWebhook} note="RAZORPAY_WEBHOOK_SECRET" />
              <Status label="Cloudinary" ok={env.cloudinary} note="Image uploads in the product editor" />
              <Status label="Resend" ok={env.resend} note="Order and account emails" />
              <Status label="Cron secret" ok={env.cron} note="Releases unpaid stock reservations" />
            </ul>
          </Panel>
        </div>
      </div>

      <Panel
        id="zones"
        title="Shipping zones"
        description="Override the default shipping fee and delivery estimate for specific states or pincodes."
        className="mt-4"
        bodyClassName="p-0 sm:p-0"
        action={canEdit ? <ZoneDialog /> : undefined}
      >
        {zones.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No zones — the default shipping fee applies everywhere.</p>
        ) : (
          <ul className="divide-y divide-border">
            {zones.map((z) => (
              <li key={z.id} className="flex min-w-0 items-start gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {z.values.name}
                    {!z.values.isActive && <Badge tone="outline">Inactive</Badge>}
                  </p>
                  <p className="text-xs text-muted">
                    <span className="num">{z.fee ? formatPrice(z.fee) : "Free"}</span>
                    {z.expressFee !== null && <> · express {formatPrice(z.expressFee)}</>} · {z.values.minDays}–{z.values.maxDays} days
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">
                    {[
                      z.values.states.length ? `${z.values.states.length} states: ${z.values.states.join(", ")}` : "",
                      z.values.pincodePrefixes ? `Pincodes ${z.values.pincodePrefixes}` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 gap-1">
                    <ZoneDialog id={z.id} initial={z.values} />
                    <ConfirmButton
                      buttonProps={{ variant: "ghost", size: "icon-sm", "aria-label": `Delete ${z.values.name}` }}
                      title={`Delete ${z.values.name}?`}
                      description="Addresses in this zone will fall back to the default shipping fee."
                      confirmLabel="Delete zone"
                      action={deleteShippingZone.bind(null, z.id)}
                    >
                      <Trash2 />
                    </ConfirmButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="mt-4">
        <BusinessCard site={site} />
      </div>
    </>
  );
}
