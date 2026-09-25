"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Eye, ShieldCheck } from "lucide-react";
import { formatDisplaySize, formatStorage } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Stars } from "@/components/ui/misc";
import { GradeTag } from "@/components/product/grade";
import { Price } from "@/components/product/price";
import { ProductImage } from "@/components/product/product-image";
import { StockStatus } from "@/components/product/stock-status";
import { AddToCartButton, CompareToggle, WishlistButton } from "@/components/product/product-actions";

const QuickView = dynamic(() => import("@/components/product/quick-view").then((m) => m.QuickView), { ssr: false });

export function specLine(p: Pick<ProductCardData, "processorFamily" | "processorGeneration" | "ramGb" | "storageGb" | "storageType">) {
  const cpu = p.processorGeneration ? `${p.processorFamily} ${p.processorGeneration}` : p.processorFamily;
  return [cpu, `${p.ramGb}GB`, `${formatStorage(p.storageGb)} ${p.storageType === "HDD" ? "HDD" : "SSD"}`];
}

export function ProductCard({
  product,
  priority,
  className,
}: {
  product: ProductCardData;
  priority?: boolean;
  className?: string;
}) {
  const [quickOpen, setQuickOpen] = React.useState(false);
  const href = `/laptops/${product.slug}`;
  const meta = { id: product.id, name: product.name, brand: product.brand.name, price: product.price, slug: product.slug };
  const out = product.stock === "out";

  return (
    <article
      className={cn(
        "group/card relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-[box-shadow,transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lift motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stage">
        <Link href={href} className="absolute inset-0" aria-label={product.name} tabIndex={-1}>
          <ProductImage
            src={product.image?.url}
            alt={product.image?.alt ?? product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
            className={cn(
              "object-contain p-3 transition-[transform,opacity] duration-500 ease-out group-hover/card:scale-[1.04] motion-reduce:group-hover/card:scale-100 sm:p-5",
              product.hoverImage && "group-hover/card:opacity-0",
              out && "opacity-60",
            )}
          />
          {product.hoverImage && (
            <ProductImage
              src={product.hoverImage.url}
              alt=""
              fill
              sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
              className="object-contain p-3 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 sm:p-5"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {product.discountPercent > 0 && (
            <span className="rounded-md bg-sale px-1.5 py-0.5 text-[11px] font-semibold text-white num">
              −{product.discountPercent}%
            </span>
          )}
          {product.isBestSeller && (
            <span className="hidden rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-medium text-white sm:inline">
              Best seller
            </span>
          )}
        </div>

        <WishlistButton product={meta} className="absolute top-2 right-2 z-10" />

        <button
          type="button"
          onClick={() => setQuickOpen(true)}
          className="absolute inset-x-3 bottom-3 z-10 hidden translate-y-2 items-center justify-center gap-1.5 rounded-lg bg-surface/95 py-2 text-[13px] font-medium opacity-0 shadow-card backdrop-blur transition-all duration-200 group-hover/card:translate-y-0 group-hover/card:opacity-100 hover:bg-surface focus-visible:translate-y-0 focus-visible:opacity-100 md:flex"
        >
          <Eye className="size-4" aria-hidden />
          Quick view
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="eyebrow truncate">{product.brand.name}</span>
          <GradeTag grade={product.conditionGrade} />
        </div>

        <h3 className="line-clamp-2 text-[14px] leading-snug font-medium text-foreground sm:text-[15px]">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] hover:text-accent focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>

        {product.ratingCount > 0 && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <Stars rating={product.ratingAvg} size={12} />
            <span className="num">({product.ratingCount})</span>
          </div>
        )}

        <p className="mt-2 flex flex-wrap gap-x-1.5 font-mono text-[11.5px] leading-relaxed text-muted sm:text-xs">
          {specLine(product).map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <span aria-hidden>·</span>}
              <span>{s}</span>
            </React.Fragment>
          ))}
          <span aria-hidden className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">{formatDisplaySize(product.displaySize)}</span>
        </p>

        <div className="mt-auto pt-3">
          <Price price={product.price} mrp={product.mrp} size="md" />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1 text-[12.5px] text-foreground/80">
              <ShieldCheck className="size-3.5 text-success" aria-hidden />
              {product.warrantyMonths}-month warranty
            </span>
            <StockStatus state={product.stock} available={product.available} />
          </div>
        </div>

        <div className="relative z-10 mt-3 flex items-center gap-2">
          <AddToCartButton
            product={meta}
            disabled={out}
            label="Add to cart"
            compactLabel="Add"
            size="sm"
            className="h-9 flex-1 sm:h-10"
          />
        </div>
        <CompareToggle slug={product.slug} name={product.name} className="relative z-10 mt-2.5 self-start" />
      </div>

      {quickOpen && <QuickView product={product} open={quickOpen} onOpenChange={setQuickOpen} />}
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
