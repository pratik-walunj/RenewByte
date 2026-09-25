"use client";

import Link from "next/link";
import { Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { GradeTag } from "@/components/product/grade";
import { ProductImage } from "@/components/product/product-image";
import { formatPrice } from "@/lib/format";
import type { CartLine as Line } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX = 5;

export function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
  label,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  label: string;
}) {
  const cap = Math.min(max, MAX);
  return (
    <div className="inline-flex h-9 items-center rounded-lg border border-border-strong" role="group" aria-label={`Quantity for ${label}`}>
      <button
        type="button"
        className="flex size-9 items-center justify-center text-muted hover:text-foreground disabled:opacity-40"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="num w-7 text-center text-sm font-medium" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="flex size-9 items-center justify-center text-muted hover:text-foreground disabled:opacity-40"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= cap}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function CartLineItem({ line, compact, onNavigate }: { line: Line; compact?: boolean; onNavigate?: () => void }) {
  const { updateQuantity, removeFromCart, setSavedForLater, pending } = useStore();
  const busy = pending.has(line.productId);
  const unavailable = !line.savedForLater && line.quantity === 0;

  return (
    <li className={cn("flex gap-3 py-4 sm:gap-4", busy && "opacity-70")}>
      <Link
        href={`/laptops/${line.slug}`}
        onClick={onNavigate}
        className={cn("relative shrink-0 overflow-hidden rounded-lg bg-stage", compact ? "size-20" : "size-24 sm:size-28")}
      >
        <ProductImage src={line.image?.url} alt={line.image?.alt ?? line.name} fill sizes="112px" className="object-contain p-2" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">{line.brand}</p>
            <Link href={`/laptops/${line.slug}`} onClick={onNavigate} className="line-clamp-2 text-sm font-medium hover:text-accent">
              {line.name}
            </Link>
          </div>
          <p className="num shrink-0 text-right text-sm font-semibold">
            {formatPrice(line.price * Math.max(line.quantity, 1))}
            {line.mrp > line.price && (
              <span className="block text-xs font-normal text-muted line-through">
                {formatPrice(line.mrp * Math.max(line.quantity, 1))}
              </span>
            )}
          </p>
        </div>
        {!compact && <p className="mt-1 truncate font-mono text-[11.5px] text-muted">{line.specs}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <GradeTag grade={line.conditionGrade} />
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <ShieldCheck className="size-3.5 text-success" aria-hidden /> {line.warrantyMonths}-mo warranty
          </span>
        </div>
        {unavailable && <p className="mt-2 text-xs font-medium text-sale">Out of stock — remove or save for later</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-3">
          {!line.savedForLater && !unavailable && (
            <QuantityStepper
              value={line.quantity}
              max={line.available}
              label={line.name}
              disabled={busy}
              onChange={(n) => updateQuantity(line.productId, n)}
            />
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => setSavedForLater(line.productId, !line.savedForLater)}
            className="text-[13px] font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
          >
            {line.savedForLater ? "Move to cart" : "Save for later"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => removeFromCart(line.productId)}
            className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-sale"
            aria-label={`Remove ${line.name}`}
          >
            <Trash2 className="size-3.5" aria-hidden />
            <span className={compact ? "sr-only" : undefined}>Remove</span>
          </button>
        </div>
      </div>
    </li>
  );
}
