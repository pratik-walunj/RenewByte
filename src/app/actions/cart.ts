"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { limitByIp } from "@/lib/rate-limit";
import type { CartView } from "@/lib/types";
import { stockState } from "@/server/catalog";
import { getCartView, getOrCreateCart, MAX_QTY_PER_LINE, reloadCartView } from "@/server/cart";

type CartResult = { ok: true; cart: CartView; message?: string } | { ok: false; error: string; cart?: CartView };

const idSchema = z.string().min(1).max(64);

export async function fetchCart(): Promise<CartView> {
  return getCartView();
}

export async function addToCart(productId: string, quantity = 1): Promise<CartResult> {
  const parsed = z.object({ productId: idSchema, quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE) }).safeParse({
    productId,
    quantity,
  });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  if (!(await limitByIp("cart", 60, 60_000)).ok) return { ok: false, error: "Too many requests. Please slow down." };

  const product = await db.product.findFirst({
    where: { id: productId, status: "PUBLISHED" },
    select: { id: true, name: true, inventory: { select: { quantity: true, reserved: true, lowStockThreshold: true } } },
  });
  if (!product) return { ok: false, error: "This product is no longer available." };
  const { available } = stockState(product.inventory);
  if (available < 1) return { ok: false, error: "Sorry, this laptop is out of stock." };

  const cart = await getOrCreateCart();
  const existing = cart.items.find((i) => i.productId === productId);
  const desired = Math.min((existing && !existing.savedForLater ? existing.quantity : 0) + quantity, available, MAX_QTY_PER_LINE);

  await db.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity: desired },
    update: { quantity: desired, savedForLater: false },
  });
  const view = await reloadCartView(cart.id);
  const capped = existing && desired < existing.quantity + quantity;
  return {
    ok: true,
    cart: view,
    message: capped ? `Only ${available} available — quantity updated.` : `${product.name} added to cart`,
  };
}

export async function updateCartQuantity(productId: string, quantity: number): Promise<CartResult> {
  const parsed = z.object({ productId: idSchema, quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE) }).safeParse({
    productId,
    quantity,
  });
  if (!parsed.success) return { ok: false, error: "Invalid quantity." };
  const cart = await getOrCreateCart();
  const item = cart.items.find((i) => i.productId === productId);
  if (!item) return { ok: false, error: "Item not found in cart." };
  const { available } = stockState(item.product.inventory);
  const qty = Math.min(quantity, Math.max(available, 1));
  await db.cartItem.update({ where: { id: item.id }, data: { quantity: qty } });
  const view = await reloadCartView(cart.id);
  return qty < quantity
    ? { ok: true, cart: view, message: `Only ${available} available.` }
    : { ok: true, cart: view };
}

export async function removeFromCart(productId: string): Promise<CartResult> {
  if (!idSchema.safeParse(productId).success) return { ok: false, error: "Invalid request." };
  const cart = await getOrCreateCart();
  await db.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  return { ok: true, cart: await reloadCartView(cart.id), message: "Removed from cart" };
}

export async function setSavedForLater(productId: string, saved: boolean): Promise<CartResult> {
  if (!idSchema.safeParse(productId).success) return { ok: false, error: "Invalid request." };
  const cart = await getOrCreateCart();
  await db.cartItem.updateMany({ where: { cartId: cart.id, productId }, data: { savedForLater: saved } });
  return {
    ok: true,
    cart: await reloadCartView(cart.id),
    message: saved ? "Saved for later" : "Moved to cart",
  };
}

export async function applyCoupon(code: string): Promise<CartResult> {
  const parsed = z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/)
    .safeParse(code);
  if (!parsed.success) return { ok: false, error: "Enter a valid coupon code." };
  if (!(await limitByIp("coupon", 15, 10 * 60_000)).ok) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }
  const cart = await getOrCreateCart();
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: parsed.data.toUpperCase() } });
  const view = await reloadCartView(cart.id);
  if (!view.coupon) {
    await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    return { ok: false, error: view.couponError ?? "This coupon code isn't valid.", cart: await reloadCartView(cart.id) };
  }
  return { ok: true, cart: view, message: `Coupon ${view.coupon.code} applied` };
}

export async function removeCoupon(): Promise<CartResult> {
  const cart = await getOrCreateCart();
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  return { ok: true, cart: await reloadCartView(cart.id), message: "Coupon removed" };
}
