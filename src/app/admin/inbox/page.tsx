import type { Metadata } from "next";
import Link from "next/link";
import { getStaffUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { inboxCounts, listContactMessages, listSubscribers, listTradeIns } from "@/server/admin/inbox";
import { oneOf, pageParam, param, type SearchParams } from "@/server/admin/pagination";
import { AdminPageHeader, FilterBar, FilterSelect } from "@/components/admin/ui";
import { AdminPagination } from "@/components/admin/pagination";
import { ContactList, SubscriberList, TradeInList } from "@/components/admin/inbox/lists";

export const metadata: Metadata = { title: "Inbox" };

const TABS = ["contact", "tradein", "newsletter"] as const;
const STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED"] as const;

export default async function InboxPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const tab = oneOf(param(sp, "tab"), TABS, "contact") || "contact";
  const status = oneOf(param(sp, "status"), STATUSES);
  const page = pageParam(sp);
  const [counts, user] = await Promise.all([inboxCounts(), getStaffUser()]);

  const tabs = [
    { value: "contact", label: "Messages", badge: counts.contact },
    { value: "tradein", label: "Trade-ins", badge: counts.tradeIn },
    { value: "newsletter", label: "Newsletter", badge: null },
  ] as const;

  return (
    <>
      <AdminPageHeader eyebrow="Customers" title="Inbox" description="Contact messages, trade-in requests and newsletter sign-ups." />

      <nav aria-label="Inbox sections" className="scrollbar-none mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => {
          const active = t.value === tab;
          return (
            <Link
              key={t.value}
              href={`/admin/inbox?tab=${t.value}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {t.label}
              {t.badge ? (
                <span className="num rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-hover">
                  {t.badge} <span className="sr-only">new</span>
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {tab !== "newsletter" && (
        <FilterBar action="/admin/inbox" hidden={{ tab }} resetHref={`/admin/inbox?tab=${tab}`}>
          <FilterSelect
            name="status"
            label="Status"
            value={status}
            options={[
              { value: "NEW", label: "New" },
              { value: "IN_PROGRESS", label: "In progress" },
              { value: "RESOLVED", label: "Resolved" },
            ]}
          />
        </FilterBar>
      )}

      {tab === "contact" && <ContactSection status={status} page={page} sp={sp} />}
      {tab === "tradein" && <TradeInSection status={status} page={page} sp={sp} />}
      {tab === "newsletter" && <NewsletterSection page={page} sp={sp} canDelete={user?.role === "ADMIN"} />}
    </>
  );
}

type SectionProps = { status: (typeof STATUSES)[number] | ""; page: number; sp: SearchParams };

async function ContactSection({ status, page, sp }: SectionProps) {
  const { rows, info } = await listContactMessages(status, page);
  return (
    <>
      <ContactList rows={rows} />
      {rows.length > 0 && <AdminPagination info={info} basePath="/admin/inbox" searchParams={sp} noun="messages" />}
    </>
  );
}

async function TradeInSection({ status, page, sp }: SectionProps) {
  const { rows, info } = await listTradeIns(status, page);
  return (
    <>
      <TradeInList rows={rows} />
      {rows.length > 0 && <AdminPagination info={info} basePath="/admin/inbox" searchParams={sp} noun="requests" />}
    </>
  );
}

async function NewsletterSection({ page, sp, canDelete }: { page: number; sp: SearchParams; canDelete: boolean }) {
  const { rows, info } = await listSubscribers(page);
  return (
    <>
      <SubscriberList rows={rows} total={info.total} canDelete={canDelete} />
      {rows.length > 0 && <AdminPagination info={info} basePath="/admin/inbox" searchParams={sp} noun="subscribers" />}
    </>
  );
}
