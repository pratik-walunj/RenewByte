"use client";

import Link from "next/link";
import { ArrowLeft, Lock, RotateCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { CartLineItem } from "@/components/cart/cart-line";
import { CouponForm, SummaryRows } from "@/components/cart/order-summary";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";

export function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]" role="status" aria-label="Loading cart">
      <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="skeleton size-28" />
            <div className="flex-1 space-y-2.5">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
              <div className="skeleton mt-4 h-9 w-40" />
            </div>
          </div>
        ))}
      </div>
      <div className="skeleton h-80" />
    </div>
  );
}

export function CartView() {
  const { ready, cart } = useStore();
  if (!ready) return <CartSkeleton />;

  const items = cart?.items ?? [];
  const saved = cart?.saved ?? [];

  if (!items.length && !saved.length) {
    return (
      <EmptyState
        icon={<ShoppingBag />}
        title="Your cart is empty"
        description="Every laptop we sell is tested, graded and backed by warranty. Start with our best sellers."
      >
        <Button asChild>
          <Link href="/laptops">Shop laptops</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/deals">View deals</Link>
        </Button>
      </EmptyState>
    );
  }

  const blocked = items.some((i) => i.quantity === 0);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-8">
        {items.length > 0 ? (
          <section aria-labelledby="cart-items-h" className="rounded-xl border border-border bg-surface px-4 sm:px-6">
            <h2 id="cart-items-h" className="sr-only">
              Items in your cart
            </h2>
            {cart?.freeShippingRemaining ? (
              <p className="-mx-4 flex items-center gap-2 border-b border-border bg-accent-soft px-4 py-2.5 text-[13px] text-accent-hover sm:-mx-6 sm:px-6">
                <Truck className="size-4" aria-hidden /> Add {formatPrice(cart.freeShippingRemaining)} more for free shipping
              </p>
            ) : null}
            <ul className="divide-y divide-border">
              {items.map((line) => (
                <CartLineItem key={line.productId} line={line} />
              ))}
            </ul>
          </section>
        ) : (
          <p className="rounded-xl border border-dashed border-border-strong p-6 text-center text-sm text-muted">
            No items in your cart. Move something from “Saved for later” below.
          </p>
        )}

        {saved.length > 0 && (
          <section aria-labelledby="saved-h">
            <h2 id="saved-h" className="mb-3 text-lg font-semibold tracking-tight">
              Saved for later <span className="font-normal text-muted">({saved.length})</span>
            </h2>
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface px-4 sm:px-6">
              {saved.map((line) => (
                <CartLineItem key={line.productId} line={line} />
              ))}
            </ul>
          </section>
        )}

        <Link href="/laptops" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Continue shopping
        </Link>
      </div>

      {items.length > 0 && cart && (
        <aside aria-labelledby="summary-h" className="rounded-xl border border-border bg-surface p-5 sm:p-6 lg:sticky lg:top-32">
          <h2 id="summary-h" className="mb-4 text-lg font-semibold tracking-tight">
            Order summary
          </h2>
          <CouponForm />
          <SummaryRows totals={cart.totals} couponCode={cart.coupon?.code} className="mt-5" />
          {blocked && (
            <p className="mt-4 rounded-lg bg-sale-soft px-3 py-2 text-[13px] text-sale">
              Remove out-of-stock items to continue.
            </p>
          )}
          <Button
            asChild={!blocked}
            size="lg"
            className="mt-5 w-full"
            disabled={blocked}
            onClick={() =>
              track({
                name: "begin_checkout",
                value: cart.totals.total,
                items: items.map((i) => ({ item_id: i.productId, item_name: i.name, item_brand: i.brand, price: i.price, quantity: i.quantity })),
              })
            }
          >
            {blocked ? <span>Proceed to checkout</span> : <Link href="/checkout">Proceed to checkout</Link>}
          </Button>
          <ul className="mt-5 space-y-2 border-t border-border pt-5 text-[13px] text-muted">
            <li className="flex items-center gap-2">
              <Lock className="size-3.5" aria-hidden /> Secure payment via Razorpay
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-3.5" aria-hidden /> Warranty on every laptop
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw className="size-3.5" aria-hidden /> Easy returns —{" "}
              <Link href="/returns" className="underline underline-offset-2 hover:text-foreground">
                policy
              </Link>
            </li>
          </ul>
        </aside>
      )}
    </div>
  );
}
