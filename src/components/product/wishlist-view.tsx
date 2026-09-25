"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { fetchProductsByIds } from "@/app/actions/store";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { GradeTag } from "@/components/product/grade";
import { Price } from "@/components/product/price";
import { ProductImage } from "@/components/product/product-image";
import { StockStatus } from "@/components/product/stock-status";
import { ProductGridSkeleton } from "@/components/product/skeletons";
import { specLine } from "@/components/product/product-card";
import type { ProductCardData } from "@/lib/types";

export function WishlistView() {
  const { ready, user, wishlist, toggleWishlist, addToCart, pending } = useStore();
  const [products, setProducts] = React.useState<ProductCardData[] | null>(null);
  const ids = React.useMemo(() => [...wishlist], [wishlist]);
  const key = ids.join(",");

  React.useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const list = key ? key.split(",") : [];
    (list.length ? fetchProductsByIds(list) : Promise.resolve([] as ProductCardData[])).then((rows) => {
      if (!cancelled) setProducts(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, key]);

  if (!ready || products === null) return <ProductGridSkeleton count={4} />;

  const visible = products.filter((p) => wishlist.has(p.id));
  if (!visible.length) {
    return (
      <EmptyState icon={<Heart />} title="Your wishlist is empty" description="Tap the heart on any laptop to save it for later.">
        <Button asChild>
          <Link href="/laptops">Browse laptops</Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <>
      {!user && (
        <p className="mb-6 rounded-lg bg-accent-soft px-4 py-3 text-sm text-accent-hover">
          Your wishlist is saved on this device.{" "}
          <Link href="/login?next=/wishlist" className="font-medium underline underline-offset-4">
            Sign in
          </Link>{" "}
          to keep it across devices.
        </p>
      )}
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {visible.map((p) => {
          const meta = { id: p.id, name: p.name, brand: p.brand.name, price: p.price };
          return (
            <li key={p.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
              <Link href={`/laptops/${p.slug}`} className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-stage sm:w-40">
                <ProductImage src={p.image?.url} alt={p.image?.alt ?? p.name} fill sizes="160px" className="object-contain p-2" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="eyebrow">{p.brand.name}</p>
                <Link href={`/laptops/${p.slug}`} className="mt-0.5 block font-medium hover:text-accent">
                  {p.name}
                </Link>
                <p className="mt-1 font-mono text-xs text-muted">{specLine(p).join(" · ")}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <GradeTag grade={p.conditionGrade} />
                  <StockStatus state={p.stock} available={p.available} />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <Price price={p.price} mrp={p.mrp} size="md" className="sm:text-right" />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={p.stock === "out" || pending.has(p.id)}
                    onClick={async () => {
                      const ok = await addToCart(meta, { openCart: false });
                      if (ok) toggleWishlist(meta);
                    }}
                  >
                    <ShoppingBag /> Move to cart
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleWishlist(meta)} aria-label={`Remove ${p.name} from wishlist`}>
                    <Trash2 />
                    <span className="sr-only sm:not-sr-only">Remove</span>
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
