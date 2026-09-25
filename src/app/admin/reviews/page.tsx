import type { Metadata } from "next";
import Link from "next/link";
import { Check, Star, X } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listReviews } from "@/server/admin/reviews";
import { oneOf, pageParam, param, type SearchParams } from "@/server/admin/pagination";
import { deleteReview, moderateReview } from "@/app/actions/admin/reviews";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Stars } from "@/components/ui/misc";
import { AdminPageHeader } from "@/components/admin/ui";
import { AdminPagination } from "@/components/admin/pagination";
import { ActionButton } from "@/components/admin/action-button";
import { ConfirmButton } from "@/components/admin/confirm-dialog";

export const metadata: Metadata = { title: "Reviews" };

const TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
] as const;

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const status = oneOf(param(sp, "status"), ["PENDING", "APPROVED", "REJECTED"] as const, "PENDING") || "PENDING";
  const { rows, info, counts } = await listReviews(status, pageParam(sp));

  return (
    <>
      <AdminPageHeader
        eyebrow="Community"
        title="Reviews"
        description="Only approved reviews appear on product pages and count towards ratings."
      />

      <nav aria-label="Review status" className="scrollbar-none mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => {
          const active = t.value === status;
          return (
            <Link
              key={t.value}
              href={`/admin/reviews?status=${t.value}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {t.label}
              <span className="num rounded-full bg-subtle px-2 py-0.5 text-xs">{counts[t.value]}</span>
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Star />}
          title={status === "PENDING" ? "No reviews waiting" : `No ${status.toLowerCase()} reviews`}
          description={status === "PENDING" ? "New customer reviews will appear here for moderation." : undefined}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <Link href={`/admin/products/${r.product.id}`} className="line-clamp-1 text-sm font-medium hover:underline">
                    {r.product.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {r.authorName}
                    {r.user ? ` · ${r.user.email}` : " · guest"} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.isVerifiedPurchase && <Badge tone="success">Verified purchase</Badge>}
                  <Stars rating={r.rating} />
                </div>
              </div>
              {r.title && <p className="mt-3 font-medium break-words">{r.title}</p>}
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-muted break-words">{r.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.status !== "APPROVED" && (
                  <ActionButton action={moderateReview.bind(null, r.id, "APPROVED")} variant="success">
                    <Check /> Approve
                  </ActionButton>
                )}
                {r.status !== "REJECTED" && (
                  <ActionButton action={moderateReview.bind(null, r.id, "REJECTED")}>
                    <X /> Reject
                  </ActionButton>
                )}
                <ConfirmButton
                  buttonProps={{ variant: "ghost", className: "text-sale" }}
                  title="Delete this review?"
                  description="The review is removed permanently and the product rating is recalculated."
                  confirmLabel="Delete review"
                  action={deleteReview.bind(null, r.id)}
                >
                  Delete
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 && <AdminPagination info={info} basePath="/admin/reviews" searchParams={sp} noun="reviews" />}
    </>
  );
}
