"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { AddToCartButton, CompareToggle, WishlistButton } from "@/components/product/product-actions";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type Meta = { id: string; name: string; brand: string; price: number; mrp: number; slug: string; outOfStock: boolean };

function useBuyNow(product: Meta) {
  const router = useRouter();
  const { addToCart, cart } = useStore();
  const [busy, setBusy] = React.useState(false);
  const buyNow = async () => {
    setBusy(true);
    const inCart = cart?.items.some((i) => i.productId === product.id);
    const ok = inCart || (await addToCart(product, { openCart: false }));
    if (ok) {
      track({
        name: "begin_checkout",
        value: product.price,
        items: [{ item_id: product.id, item_name: product.name, item_brand: product.brand, price: product.price, quantity: 1 }],
      });
      router.push("/checkout");
    } else setBusy(false);
  };
  return { buyNow, busy };
}

export function BuyActions({ product }: { product: Meta }) {
  const { buyNow, busy } = useBuyNow(product);
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <AddToCartButton product={product} disabled={product.outOfStock} size="lg" variant="outline" className="flex-1" />
        <WishlistButton product={product} variant="outline" />
      </div>
      <Button size="lg" className="w-full" disabled={product.outOfStock || busy} onClick={buyNow}>
        {busy ? <Loader2 className="animate-spin" /> : <Zap />}
        Buy now
      </Button>
      <CompareToggle slug={product.slug} name={product.name} />
    </div>
  );
}

/** Mobile-only sticky purchase bar, shown once the main buy buttons scroll away. */
export function StickyBuyBar({ product, anchorId }: { product: Meta; anchorId: string }) {
  const { buyNow, busy } = useBuyNow(product);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const anchor = document.getElementById(anchorId);
    if (!anchor) return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
      threshold: 0,
    });
    io.observe(anchor);
    document.body.dataset.stickyCta = "";
    return () => {
      io.disconnect();
      delete document.body.dataset.stickyCta;
    };
  }, [anchorId]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(15_23_42/0.2)] backdrop-blur transition-transform duration-200 lg:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3">
        <div className="num min-w-0">
          <p className="text-lg leading-tight font-semibold">{formatPrice(product.price)}</p>
          {product.mrp > product.price && <p className="text-xs text-muted line-through">{formatPrice(product.mrp)}</p>}
        </div>
        <div className="ml-auto flex gap-2">
          <AddToCartButton
            product={product}
            disabled={product.outOfStock}
            label="Add"
            variant="outline"
            className="h-11 px-4"
            openCart={false}
          />
          <Button className="h-11 px-5" disabled={product.outOfStock || busy} onClick={buyNow} tabIndex={visible ? 0 : -1}>
            Buy now
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TrackProductView({ id, name, brand, price }: { id: string; name: string; brand: string; price: number }) {
  React.useEffect(() => {
    track({ name: "view_item", item: { item_id: id, item_name: name, item_brand: brand, price } });
  }, [id, name, brand, price]);
  return null;
}
