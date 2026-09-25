"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { submitReview } from "@/app/actions/reviews";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Stars } from "@/components/ui/misc";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
};

function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const { user, ready } = useStore();
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [errors, setErrors] = React.useState<Record<string, string[] | undefined>>({});
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  if (!ready) return null;
  if (!user) {
    return (
      <p className="text-sm text-muted">
        <Link href={`/login?next=/laptops/${slug}%23reviews`} className="font-medium text-accent hover:underline">
          Sign in
        </Link>{" "}
        to write a review.
      </p>
    );
  }
  if (done) {
    return (
      <p className="rounded-lg bg-success-soft px-4 py-3 text-sm text-success">
        Thanks! Your review has been submitted and will appear once it has been checked.
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (!rating) {
          setErrors({ rating: ["Please choose a rating"] });
          return;
        }
        setBusy(true);
        const res = await submitReview({
          productId,
          rating,
          title: String(fd.get("title") ?? ""),
          body: String(fd.get("body") ?? ""),
        });
        setBusy(false);
        if (res.ok) {
          setDone(true);
          toast.success("Review submitted for moderation");
        } else {
          setErrors(("fieldErrors" in res && res.fieldErrors) || {});
          toast.error(res.error);
        }
      }}
    >
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} className="peer sr-only" checked={rating === n} onChange={() => setRating(n)} />
              <span className="sr-only">{n} star{n > 1 ? "s" : ""}</span>
              <Star
                aria-hidden
                className={cn(
                  "size-7 rounded transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-accent",
                  (hover || rating) >= n ? "fill-warning-bright text-warning-bright" : "text-border-strong",
                )}
              />
            </label>
          ))}
        </div>
        {errors.rating && <p className="mt-1 text-[13px] text-sale">{errors.rating[0]}</p>}
      </fieldset>
      <Field label="Title" htmlFor="review-title" optional>
        <Input id="review-title" name="title" maxLength={80} />
      </Field>
      <Field label="Review" htmlFor="review-body" error={errors.body?.[0]} hint="How is the condition, battery and performance?">
        <Textarea id="review-body" name="body" required minLength={20} maxLength={2000} aria-invalid={!!errors.body} />
      </Field>
      <Button type="submit" disabled={busy}>
        {busy ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}

export function ProductReviews({
  productId,
  slug,
  average,
  count,
  distribution,
  reviews,
}: {
  productId: string;
  slug: string;
  average: number;
  count: number;
  distribution: { rating: number; count: number }[];
  reviews: Review[];
}) {
  const [showForm, setShowForm] = React.useState(false);
  return (
    <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
      <div>
        {count > 0 ? (
          <>
            <p className="num text-5xl font-semibold tracking-tight">{average.toFixed(1)}</p>
            <Stars rating={average} size={18} className="mt-2" />
            <p className="mt-1 text-sm text-muted">
              Based on {count} {count === 1 ? "review" : "reviews"}
            </p>
            <ul className="mt-5 space-y-1.5">
              {distribution.map((d) => (
                <li key={d.rating} className="flex items-center gap-2 text-[13px]">
                  <span className="num w-3 text-muted">{d.rating}</span>
                  <Star className="size-3.5 fill-warning-bright text-warning-bright" aria-hidden />
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
                    <span className="block h-full rounded-full bg-warning-bright" style={{ width: `${count ? (d.count / count) * 100 : 0}%` }} />
                  </span>
                  <span className="num w-6 text-right text-muted">{d.count}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted">No reviews yet. Bought this laptop? Share your experience.</p>
        )}
        <Button variant="outline" className="mt-6 w-full" onClick={() => setShowForm((s) => !s)} aria-expanded={showForm}>
          Write a review
        </Button>
      </div>
      <div className="min-w-0">
        {showForm && (
          <div className="mb-8 rounded-xl border border-border bg-surface p-5">
            <ReviewForm productId={productId} slug={slug} />
          </div>
        )}
        {reviews.length > 0 ? (
          <ul className="divide-y divide-border">
            {reviews.map((r) => (
              <li key={r.id} className="py-5 first:pt-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars rating={r.rating} />
                  {r.title && <p className="font-medium">{r.title}</p>}
                </div>
                <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-foreground/85">{r.body}</p>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                  <span className="font-medium text-foreground">{r.authorName}</span>·<span>{formatDate(r.createdAt)}</span>
                  {r.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-success">
                      <BadgeCheck className="size-3.5" aria-hidden /> Verified purchase
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          !showForm && (
            <div className="rounded-xl border border-dashed border-border-strong p-8 text-center text-sm text-muted">
              Reviews appear here after moderation. We never publish invented reviews.
            </div>
          )
        )}
      </div>
    </div>
  );
}
