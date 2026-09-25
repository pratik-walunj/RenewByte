import { Download, Trash2 } from "lucide-react";
import type { ContactMessage, NewsletterSubscriber, TradeInRequest } from "@/generated/prisma/client";
import { formatDateTime, formatStorage } from "@/lib/format";
import { deleteSubscriber } from "@/app/actions/admin/inbox";
import { Button } from "@/components/ui/button";
import { InboxStatusBadge } from "@/components/admin/badges";
import { ConfirmButton } from "@/components/admin/confirm-dialog";
import { InboxStatusSelect } from "@/components/admin/inbox/status-select";

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-border-strong bg-surface px-5 py-10 text-center text-sm text-muted">{text}</p>;
}

function Contact({ email, phone }: { email: string; phone?: string | null }) {
  return (
    <p className="text-xs text-muted">
      <a href={`mailto:${email}`} className="break-all hover:underline">
        {email}
      </a>
      {phone && (
        <>
          {" · "}
          <a href={`tel:${phone}`} className="hover:underline">
            {phone}
          </a>
        </>
      )}
    </p>
  );
}

export function ContactList({ rows }: { rows: ContactMessage[] }) {
  if (!rows.length) return <Empty text="No messages here." />;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((m) => (
        <li key={m.id} className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="font-medium break-words">{m.subject}</p>
              <p className="text-sm">{m.name}</p>
              <Contact email={m.email} phone={m.phone} />
            </div>
            <div className="flex flex-col items-end gap-1">
              <InboxStatusBadge status={m.status} />
              <span className="text-xs text-muted">{formatDateTime(m.createdAt)}</span>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted break-words">{m.message}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <InboxStatusSelect kind="contact" id={m.id} status={m.status} />
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>Reply by email</a>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TradeInList({ rows }: { rows: TradeInRequest[] }) {
  if (!rows.length) return <Empty text="No trade-in requests here." />;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((t) => {
        const specs = [
          t.processor,
          t.ramGb ? `${t.ramGb}GB RAM` : null,
          t.storageGb ? formatStorage(t.storageGb) : null,
          t.ageYears !== null ? `${t.ageYears} yr old` : null,
        ].filter(Boolean);
        return (
          <li key={t.id} className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <p className="font-medium break-words">
                  {t.brand} {t.model}
                </p>
                <p className="text-sm">
                  {t.name} · {t.city}
                </p>
                <Contact email={t.email} phone={t.phone} />
              </div>
              <div className="flex flex-col items-end gap-1">
                <InboxStatusBadge status={t.status} />
                <span className="text-xs text-muted">{formatDateTime(t.createdAt)}</span>
              </div>
            </div>
            <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="text-muted">Condition</dt>
                <dd className="min-w-0 break-words">{t.condition}</dd>
              </div>
              {specs.length > 0 && (
                <div className="flex gap-2">
                  <dt className="text-muted">Specs</dt>
                  <dd className="min-w-0 break-words">{specs.join(" · ")}</dd>
                </div>
              )}
            </dl>
            {t.notes && <p className="mt-2 text-sm whitespace-pre-line text-muted break-words">{t.notes}</p>}
            <div className="mt-4 border-t border-border pt-3">
              <InboxStatusSelect kind="tradein" id={t.id} status={t.status} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function SubscriberList({ rows, total, canDelete }: { rows: NewsletterSubscriber[]; total: number; canDelete: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <p className="text-sm">
          <span className="num font-semibold">{total}</span> subscribers
        </p>
        <Button asChild variant="outline" size="sm">
          <a href="/api/admin/newsletter/export" download>
            <Download /> Export CSV
          </a>
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted">No subscribers yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((s) => (
            <li key={s.id} className="flex min-w-0 items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
              <span className="min-w-0 truncate text-sm">{s.email}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="hidden text-xs text-muted sm:inline">{formatDateTime(s.createdAt)}</span>
                {canDelete && (
                  <ConfirmButton
                    buttonProps={{ variant: "ghost", size: "icon-sm", "aria-label": `Remove ${s.email}` }}
                    title="Remove subscriber?"
                    description={`${s.email} will no longer receive newsletters.`}
                    confirmLabel="Remove"
                    action={deleteSubscriber.bind(null, s.id)}
                  >
                    <Trash2 />
                  </ConfirmButton>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
