"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { limitByIp } from "@/lib/rate-limit";
import { getCartView } from "@/server/cart";
import { getProductsByIds, getProductsBySlugs } from "@/server/catalog";

/** Everything the client needs on first load, in one round trip. */
export async function bootstrapStore() {
  const user = await getCurrentUser();
  const [cart, wishlist] = await Promise.all([
    getCartView(),
    user
      ? db.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } })
      : Promise.resolve([]),
  ]);
  return {
    user: user ? { name: user.name, email: user.email, isStaff: user.role !== "CUSTOMER" } : null,
    cart,
    wishlist: wishlist.map((w) => w.productId),
  };
}

const ids = z.array(z.string().min(1).max(64)).max(100);

export async function toggleWishlist(productId: string, on: boolean) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "signin" };
  if (!(await limitByIp("wishlist", 60, 60_000)).ok) return { ok: false as const, error: "Too many requests." };
  if (!z.string().min(1).max(64).safeParse(productId).success) return { ok: false as const, error: "Invalid request." };
  if (on) {
    const exists = await db.product.count({ where: { id: productId } });
    if (!exists) return { ok: false as const, error: "Product not found." };
    await db.wishlistItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId },
      update: {},
    });
  } else {
    await db.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
  }
  return { ok: true as const };
}

/** After sign-in, merge items saved while browsing anonymously. */
export async function mergeWishlist(productIds: string[]) {
  const user = await getCurrentUser();
  if (!user) return [];
  const parsed = ids.safeParse(productIds);
  if (parsed.success && parsed.data.length) {
    const existing = await db.product.findMany({ where: { id: { in: parsed.data } }, select: { id: true } });
    await db.wishlistItem.createMany({
      data: existing.map((p) => ({ userId: user.id, productId: p.id })),
      skipDuplicates: true,
    });
  }
  const all = await db.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } });
  return all.map((w) => w.productId);
}

export async function fetchProductsByIds(productIds: string[]) {
  const parsed = ids.safeParse(productIds);
  return parsed.success ? getProductsByIds(parsed.data) : [];
}

export async function fetchProductsBySlugs(slugs: string[]) {
  const parsed = z.array(z.string().min(1).max(120)).max(10).safeParse(slugs);
  return parsed.success ? getProductsBySlugs(parsed.data) : [];
}
