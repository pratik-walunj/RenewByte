"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  addToCart as addToCartAction,
  applyCoupon as applyCouponAction,
  removeCoupon as removeCouponAction,
  removeFromCart as removeFromCartAction,
  setSavedForLater as setSavedForLaterAction,
  updateCartQuantity as updateQuantityAction,
} from "@/app/actions/cart";
import { bootstrapStore, mergeWishlist, toggleWishlist as toggleWishlistAction } from "@/app/actions/store";
import { track } from "@/lib/analytics";
import { COMPARE_LIMIT } from "@/lib/constants";
import type { CartView } from "@/lib/types";

type StoreUser = { name: string; email: string; isStaff: boolean } | null;
type ItemMeta = { id: string; name: string; brand?: string; price?: number; slug?: string };

type StoreContextValue = {
  ready: boolean;
  user: StoreUser;
  cart: CartView | null;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  pending: Set<string>;
  addToCart: (item: ItemMeta, opts?: { quantity?: number; openCart?: boolean }) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  setSavedForLater: (productId: string, saved: boolean) => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<void>;
  refresh: () => Promise<void>;
  wishlist: Set<string>;
  toggleWishlist: (item: ItemMeta) => void;
  compare: string[];
  toggleCompare: (slug: string, name?: string) => void;
  clearCompare: () => void;
};

const StoreContext = React.createContext<StoreContextValue | null>(null);

const WISHLIST_KEY = "rb:wishlist";
const COMPARE_KEY = "rb:compare";

function readLocal(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string").slice(0, 100) : [];
  } catch {
    return [];
  }
}

function writeLocal(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) */
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [user, setUser] = React.useState<StoreUser>(null);
  const [cart, setCart] = React.useState<CartView | null>(null);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [pending, setPending] = React.useState<Set<string>>(new Set());
  const [wishlist, setWishlist] = React.useState<Set<string>>(new Set());
  const [compare, setCompare] = React.useState<string[]>([]);

  /** Fetch session, cart and wishlist. All state updates happen in promise callbacks. */
  const load = React.useCallback(
    () =>
      bootstrapStore()
        .then(async (data) => {
          const local = readLocal(WISHLIST_KEY);
          let wished = local;
          if (data.user) {
            wished = local.length ? await mergeWishlist(local) : data.wishlist;
            if (local.length) writeLocal(WISHLIST_KEY, []);
          }
          setUser(data.user);
          setCart(data.cart);
          setWishlist(new Set(wished));
        })
        .catch((err) => {
          console.error("Store bootstrap failed", err);
          setWishlist(new Set(readLocal(WISHLIST_KEY)));
        })
        .finally(() => {
          setCompare(readLocal(COMPARE_KEY).slice(0, COMPARE_LIMIT));
          setReady(true);
        }),
    [],
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  const withPending = React.useCallback(async <T,>(key: string, fn: () => Promise<T>) => {
    setPending((s) => new Set(s).add(key));
    try {
      return await fn();
    } finally {
      setPending((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
    }
  }, []);

  const addToCart = React.useCallback<StoreContextValue["addToCart"]>(
    async (item, opts) =>
      withPending(item.id, async () => {
        const res = await addToCartAction(item.id, opts?.quantity ?? 1);
        if (!res.ok) {
          toast.error(res.error);
          return false;
        }
        setCart(res.cart);
        track({ name: "add_to_cart", item: { item_id: item.id, item_name: item.name, item_brand: item.brand, price: item.price, quantity: opts?.quantity ?? 1 } });
        if (opts?.openCart !== false) setCartOpen(true);
        else toast.success(res.message ?? "Added to cart");
        return true;
      }),
    [withPending],
  );

  const updateQuantity = React.useCallback(
    async (productId: string, quantity: number) => {
      // Optimistic update so the stepper feels instant.
      setCart((c) =>
        c ? { ...c, items: c.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)) } : c,
      );
      await withPending(productId, async () => {
        const res = await updateQuantityAction(productId, quantity);
        if (res.ok) {
          setCart(res.cart);
          if (res.message) toast(res.message);
        } else toast.error(res.error);
      });
    },
    [withPending],
  );

  const removeFromCart = React.useCallback(
    async (productId: string) => {
      await withPending(productId, async () => {
        const res = await removeFromCartAction(productId);
        if (res.ok) {
          setCart(res.cart);
          toast(res.message ?? "Removed from cart");
        } else toast.error(res.error);
      });
    },
    [withPending],
  );

  const setSavedForLater = React.useCallback(
    async (productId: string, saved: boolean) => {
      await withPending(productId, async () => {
        const res = await setSavedForLaterAction(productId, saved);
        if (res.ok) {
          setCart(res.cart);
          toast(res.message);
        } else toast.error(res.error);
      });
    },
    [withPending],
  );

  const applyCoupon = React.useCallback(async (code: string) => {
    const res = await applyCouponAction(code);
    if (res.cart) setCart(res.cart);
    if (res.ok) {
      toast.success(res.message ?? "Coupon applied");
      return true;
    }
    toast.error(res.error);
    return false;
  }, []);

  const removeCoupon = React.useCallback(async () => {
    const res = await removeCouponAction();
    if (res.ok) setCart(res.cart);
  }, []);

  const wishlistRef = React.useRef(wishlist);
  const compareRef = React.useRef(compare);
  React.useEffect(() => {
    wishlistRef.current = wishlist;
    compareRef.current = compare;
  }, [wishlist, compare]);

  const toggleWishlist = React.useCallback(
    (item: ItemMeta) => {
      const next = new Set(wishlistRef.current);
      const on = !next.has(item.id);
      if (on) next.add(item.id);
      else next.delete(item.id);
      wishlistRef.current = next;
      setWishlist(next);

      if (user) {
        void toggleWishlistAction(item.id, on).then((res) => {
          if (res.ok) return;
          toast.error(res.error === "signin" ? "Please sign in again." : res.error);
          setWishlist((s) => {
            const r = new Set(s);
            if (on) r.delete(item.id);
            else r.add(item.id);
            return r;
          });
        });
      } else {
        writeLocal(WISHLIST_KEY, [...next]);
      }

      if (on) {
        track({
          name: "add_to_wishlist",
          item: { item_id: item.id, item_name: item.name, item_brand: item.brand, price: item.price },
        });
        toast.success("Saved to wishlist", { action: { label: "View", onClick: () => router.push("/wishlist") } });
      } else {
        toast("Removed from wishlist");
      }
    },
    [user, router],
  );

  const toggleCompare = React.useCallback(
    (slug: string, name?: string) => {
      const prev = compareRef.current;
      if (prev.includes(slug)) {
        const next = prev.filter((s) => s !== slug);
        writeLocal(COMPARE_KEY, next);
        compareRef.current = next;
        setCompare(next);
        return;
      }
      if (prev.length >= COMPARE_LIMIT) {
        toast.error(`You can compare up to ${COMPARE_LIMIT} laptops.`, {
          action: { label: "Compare now", onClick: () => router.push("/compare") },
        });
        return;
      }
      const next = [...prev, slug];
      writeLocal(COMPARE_KEY, next);
      compareRef.current = next;
      setCompare(next);
      toast.success(name ? `${name} added to compare` : "Added to compare", {
        action: { label: "Compare", onClick: () => router.push("/compare") },
      });
    },
    [router],
  );

  const clearCompare = React.useCallback(() => {
    writeLocal(COMPARE_KEY, []);
    setCompare([]);
  }, []);

  const value = React.useMemo<StoreContextValue>(
    () => ({
      ready,
      user,
      cart,
      cartOpen,
      setCartOpen,
      pending,
      addToCart,
      updateQuantity,
      removeFromCart,
      setSavedForLater,
      applyCoupon,
      removeCoupon,
      refresh: load,
      wishlist,
      toggleWishlist,
      compare,
      toggleCompare,
      clearCompare,
    }),
    [ready, user, cart, cartOpen, pending, addToCart, updateQuantity, removeFromCart, setSavedForLater, applyCoupon, removeCoupon, load, wishlist, toggleWishlist, compare, toggleCompare, clearCompare],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
