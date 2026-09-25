"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, GitCompareArrows, Heart, Loader2, ShoppingBag } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Meta = { id: string; name: string; brand?: string; price?: number; slug?: string };

export function WishlistButton({
  product,
  className,
  variant = "floating",
}: {
  product: Meta;
  className?: string;
  variant?: "floating" | "outline";
}) {
  const { wishlist, toggleWishlist } = useStore();
  const active = wishlist.has(product.id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={cn(
        "inline-flex items-center justify-center transition-colors",
        variant === "floating" &&
          "size-9 rounded-full bg-surface/90 text-foreground shadow-card backdrop-blur hover:bg-surface hover:text-sale",
        variant === "outline" && "size-12 rounded-lg border border-border-strong bg-surface hover:border-foreground/40",
        className,
      )}
    >
      <motion.span
        key={active ? "on" : "off"}
        initial={{ scale: active ? 0.6 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="inline-flex"
      >
        <Heart className={cn("size-[18px]", active && "fill-sale text-sale")} strokeWidth={1.75} />
      </motion.span>
    </button>
  );
}

export function CompareToggle({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const { compare, toggleCompare } = useStore();
  const active = compare.includes(slug);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCompare(slug, name);
      }}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 text-[12.5px] font-medium transition-colors",
        active ? "text-accent" : "text-muted hover:text-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-4 items-center justify-center rounded border transition-colors",
          active ? "border-accent bg-accent text-white" : "border-border-strong bg-surface",
        )}
      >
        {active ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <GitCompareArrows className="size-3.5 sm:hidden" aria-hidden />
      <span>Compare</span>
    </button>
  );
}

export function AddToCartButton({
  product,
  disabled,
  label = "Add to cart",
  compactLabel,
  openCart,
  className,
  size = "md",
  variant = "primary",
}: {
  product: Meta;
  disabled?: boolean;
  label?: string;
  compactLabel?: string;
  openCart?: boolean;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}) {
  const { addToCart, pending } = useStore();
  const [done, setDone] = React.useState(false);
  const busy = pending.has(product.id);

  React.useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={disabled || busy}
      className={className}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const ok = await addToCart(product, { openCart });
        if (ok) setDone(true);
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={busy ? "busy" : done ? "done" : "idle"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className="inline-flex items-center gap-2"
        >
          {busy ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : done ? (
            <Check aria-hidden />
          ) : (
            <ShoppingBag aria-hidden />
          )}
          {disabled ? (
            "Out of stock"
          ) : compactLabel ? (
            <>
              <span className="sm:hidden">{done ? "Added" : compactLabel}</span>
              <span className="hidden sm:inline">{done ? "Added" : label}</span>
            </>
          ) : done ? (
            "Added"
          ) : (
            label
          )}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
