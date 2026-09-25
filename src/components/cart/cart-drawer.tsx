"use client";

import Link from "next/link";
import { ShoppingBag, Truck } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/dialog";
import { CartLineItem } from "@/components/cart/cart-line";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, ready } = useStore();
  const close = () => setCartOpen(false);
  const items = cart?.items ?? [];

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right">
        <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
          <SheetTitle className="text-base">
            Your cart {cart && cart.count > 0 && <span className="font-normal text-muted">({cart.count})</span>}
          </SheetTitle>
          <SheetDescription className="sr-only">Items in your shopping cart</SheetDescription>
        </div>

        {!ready ? (
          <div className="flex-1 space-y-4 p-5">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="skeleton size-20" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-4 w-4/5" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-subtle text-muted">
              <ShoppingBag className="size-6" aria-hidden />
            </div>
            <p className="font-semibold">Your cart is empty</p>
            <p className="mt-1 text-sm text-muted">Every laptop is tested, graded and backed by warranty.</p>
            <Button asChild className="mt-6" onClick={close}>
              <Link href="/laptops">Shop laptops</Link>
            </Button>
          </div>
        ) : (
          <>
            {cart?.freeShippingRemaining !== null && cart?.freeShippingRemaining !== undefined && cart.freeShippingRemaining > 0 && (
              <p className="flex items-center gap-2 border-b border-border bg-accent-soft px-5 py-2.5 text-[13px] text-accent-hover">
                <Truck className="size-4" aria-hidden />
                Add {formatPrice(cart.freeShippingRemaining)} more for free shipping
              </p>
            )}
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
              {items.map((line) => (
                <CartLineItem key={line.productId} line={line} compact onNavigate={close} />
              ))}
            </ul>
            <div className="shrink-0 border-t border-border bg-surface p-5">
              <div className="num mb-1 flex items-baseline justify-between">
                <span className="text-sm text-muted">Subtotal</span>
                <span className="text-lg font-semibold">{formatPrice(cart!.totals.subtotal - cart!.totals.discount)}</span>
              </div>
              <p className="mb-4 text-xs text-muted">
                {cart!.totals.shipping === 0 ? "Free shipping." : "Shipping calculated at checkout."} Prices include GST.
              </p>
              <div className="grid gap-2">
                <Button asChild size="lg" onClick={close}>
                  <Link href="/checkout">Checkout</Link>
                </Button>
                <Button asChild size="lg" variant="outline" onClick={close}>
                  <Link href="/cart">View cart</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
