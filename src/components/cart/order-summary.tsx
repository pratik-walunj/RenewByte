"use client";

import * as React from "react";
import { Loader2, Tag, X } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import type { CartTotals } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SummaryRows({
  totals,
  couponCode,
  shippingLabel,
  className,
}: {
  totals: CartTotals;
  couponCode?: string | null;
  shippingLabel?: string;
  className?: string;
}) {
  const mrpSavings = totals.mrpTotal - totals.subtotal;
  return (
    <dl className={cn("num space-y-2.5 text-sm", className)}>
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd>{formatPrice(totals.subtotal)}</dd>
      </div>
      {mrpSavings > 0 && (
        <div className="flex justify-between text-success">
          <dt>You save vs. original price</dt>
          <dd>{formatPrice(mrpSavings)}</dd>
        </div>
      )}
      {totals.discount > 0 && (
        <div className="flex justify-between text-success">
          <dt>Coupon{couponCode ? ` (${couponCode})` : ""}</dt>
          <dd>−{formatPrice(totals.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted">{shippingLabel ?? "Shipping"}</dt>
        <dd>{totals.shipping === 0 ? <span className="font-medium text-success">Free</span> : formatPrice(totals.shipping)}</dd>
      </div>
      {totals.codFee > 0 && (
        <div className="flex justify-between">
          <dt className="text-muted">Cash on delivery fee</dt>
          <dd>{formatPrice(totals.codFee)}</dd>
        </div>
      )}
      {!totals.taxIncluded && (
        <div className="flex justify-between">
          <dt className="text-muted">GST</dt>
          <dd>{formatPrice(totals.tax)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-border pt-3">
        <dt className="text-[15px] font-semibold">Total</dt>
        <dd className="text-xl font-semibold tracking-tight">{formatPrice(totals.total)}</dd>
      </div>
      {totals.taxIncluded && totals.tax > 0 && (
        <p className="text-right text-xs text-muted">Includes {formatPrice(totals.tax)} GST</p>
      )}
    </dl>
  );
}

export function CouponForm() {
  const { cart, applyCoupon, removeCoupon } = useStore();
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  if (cart?.coupon) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed border-success/50 bg-success-soft px-3 py-2.5">
        <p className="flex items-center gap-2 text-sm">
          <Tag className="size-4 text-success" aria-hidden />
          <span>
            <span className="font-mono font-semibold">{cart.coupon.code}</span>
            <span className="text-success"> applied</span>
          </span>
        </p>
        <button
          type="button"
          onClick={() => removeCoupon()}
          className="inline-flex size-7 items-center justify-center rounded-full text-muted hover:bg-white hover:text-foreground"
          aria-label="Remove coupon"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        setBusy(true);
        const ok = await applyCoupon(code.trim());
        setBusy(false);
        if (ok) setCode("");
      }}
    >
      <label htmlFor="coupon" className="sr-only">
        Coupon code
      </label>
      <Input
        id="coupon"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Coupon code"
        className="font-mono uppercase placeholder:font-sans placeholder:normal-case"
        autoComplete="off"
        maxLength={40}
      />
      <Button type="submit" variant="outline" disabled={busy || !code.trim()} className="h-11 sm:h-10">
        {busy ? <Loader2 className="animate-spin" /> : "Apply"}
      </Button>
    </form>
  );
}
