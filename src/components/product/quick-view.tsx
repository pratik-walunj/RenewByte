"use client";

import Link from "next/link";
import { ArrowRight, BatteryMedium, ShieldCheck } from "lucide-react";
import { formatDisplaySize, formatStorage } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GradeInfoDialog, GradeTag } from "@/components/product/grade";
import { Price } from "@/components/product/price";
import { ProductImage } from "@/components/product/product-image";
import { StockStatus } from "@/components/product/stock-status";
import { AddToCartButton, WishlistButton } from "@/components/product/product-actions";

export function QuickView({
  product,
  open,
  onOpenChange,
}: {
  product: ProductCardData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const href = `/laptops/${product.slug}`;
  const specs = [
    ["Processor", product.processor],
    ["Memory", `${product.ramGb}GB RAM`],
    ["Storage", `${formatStorage(product.storageGb)} ${product.storageType === "HDD" ? "HDD" : "SSD"}`],
    ["Display", `${formatDisplaySize(product.displaySize)} ${product.resolution ?? ""}`.trim()],
    ["Graphics", product.graphics],
    ["OS", product.operatingSystem],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[4/3] bg-stage md:aspect-auto md:rounded-l-2xl">
            <ProductImage
              src={product.image?.url}
              alt={product.image?.alt ?? product.name}
              fill
              sizes="(min-width: 768px) 384px, 100vw"
              className="object-contain p-6"
            />
          </div>
          <div className="flex flex-col p-6">
            <p className="eyebrow">{product.brand.name}</p>
            <DialogTitle className="mt-1 pr-8 text-xl">{product.name}</DialogTitle>
            <DialogDescription className="sr-only">Quick view of {product.name}</DialogDescription>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <GradeTag grade={product.conditionGrade} size="md" />
              <StockStatus state={product.stock} available={product.available} />
            </div>
            <div className="mt-2">
              <GradeInfoDialog grade={product.conditionGrade} />
            </div>
            <Price price={product.price} mrp={product.mrp} size="lg" className="mt-4" />
            <dl className="mt-4 divide-y divide-border rounded-lg border border-border text-sm">
              {specs.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[96px_1fr] gap-3 px-3 py-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-success" aria-hidden /> {product.warrantyMonths}-month warranty
              </span>
              {product.batteryHealth !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <BatteryMedium className="size-4 text-success" aria-hidden /> Battery health {product.batteryHealth}%
                </span>
              )}
            </div>
            <div className="mt-6 flex gap-2">
              <AddToCartButton
                product={{ id: product.id, name: product.name, brand: product.brand.name, price: product.price }}
                disabled={product.stock === "out"}
                className="flex-1"
                size="lg"
              />
              <WishlistButton
                product={{ id: product.id, name: product.name, brand: product.brand.name, price: product.price }}
                variant="outline"
              />
            </div>
            <Button asChild variant="link" className="mt-3 self-start">
              <Link href={href}>
                View full details <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
