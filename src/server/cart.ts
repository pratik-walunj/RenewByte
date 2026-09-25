import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { generateToken } from "@/lib/auth/tokens";
import { getCurrentUser } from "@/lib/auth/session";
import { formatStorage } from "@/lib/format";
import type { CartLine, CartView } from "@/lib/types";
import { stockState } from "@/server/catalog";
import { evaluateCoupon } from "@/server/coupons";
import { computeTotals } from "@/server/pricing";
import { getStoreSettings } from "@/server/settings";
import { quoteShipping } from "@/server/shipping";

export const CART_COOKIE = "rb_cart";
export const MAX_QTY_PER_LINE = 5;

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          price: true,
          mrp: true,
          categoryId: true,
          conditionGrade: true,
          warrantyMonths: true,
          processor: true,
          ramGb: true,
          storageGb: true,
          brand: { select: { name: true } },
          images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" as const }, take: 1 },
          inventory: { select: { quantity: true, reserved: true, lowStockThreshold: true } },
        },
      },
    },
  },
};

async function findCart() {
  const user = await getCurrentUser();
  if (user) {
    return db.cart.findUnique({ where: { userId: user.id }, include: cartInclude });
  }
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return null;
  return db.cart.findUnique({ where: { guestToken: token }, include: cartInclude });
}

/** Get the visitor's cart, creating it (and the guest cookie) if needed. Server actions only. */
export async function getOrCreateCart() {
  const existing = await findCart();
  if (existing) return existing;
  const user = await getCurrentUser();
  if (user) {
    return db.cart.create({ data: { userId: user.id }, include: cartInclude });
  }
  const token = generateToken(24);
  (await cookies()).set(CART_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return db.cart.create({ data: { guestToken: token }, include: cartInclude });
}

type CartWithItems = NonNullable<Awaited<ReturnType<typeof findCart>>>;

const EMPTY_VIEW: CartView = {
  items: [],
  saved: [],
  count: 0,
  coupon: null,
  couponError: null,
  totals: { subtotal: 0, mrpTotal: 0, discount: 0, shipping: 0, codFee: 0, tax: 0, total: 0, taxIncluded: true },
  freeShippingRemaining: null,
};

export async function buildCartView(cart: CartWithItems | null): Promise<CartView> {
  if (!cart) return EMPTY_VIEW;
  const settings = await getStoreSettings();
  const user = await getCurrentUser();

  const lines: (CartLine & { categoryId: string })[] = cart.items
    .filter((i) => i.product.status === "PUBLISHED")
    .map((i) => {
      const p = i.product;
      const { available } = stockState(p.inventory);
      const quantity = i.savedForLater ? i.quantity : Math.min(i.quantity, Math.max(available, 0));
      return {
        productId: p.id,
        categoryId: p.categoryId,
        slug: p.slug,
        name: p.name,
        brand: p.brand.name,
        image: p.images[0] ?? null,
        specs: `${p.processor} · ${p.ramGb}GB RAM · ${formatStorage(p.storageGb)}`,
        conditionGrade: p.conditionGrade,
        warrantyMonths: p.warrantyMonths,
        price: p.price,
        mrp: p.mrp,
        quantity: Math.max(quantity, i.savedForLater ? i.quantity : 0),
        available,
        savedForLater: i.savedForLater,
        lineTotal: p.price * quantity,
      };
    });

  const active = lines.filter((l) => !l.savedForLater && l.quantity > 0);
  const unavailable = lines.filter((l) => !l.savedForLater && l.quantity === 0);
  const saved = lines.filter((l) => l.savedForLater);
  const subtotal = active.reduce((s, l) => s + l.lineTotal, 0);

  let coupon: CartView["coupon"] = null;
  let couponError: string | null = null;
  if (cart.couponCode && active.length) {
    const res = await evaluateCoupon(cart.couponCode, {
      lines: active.map((l) => ({ productId: l.productId, categoryId: l.categoryId, price: l.price, quantity: l.quantity })),
      userId: user?.id,
      email: user?.email,
    });
    if (res.ok) coupon = { code: res.code, discount: res.discount, description: res.description };
    else couponError = res.error;
  }

  const [standard] = await quoteShipping({ subtotal, settings });
  const totals = computeTotals({
    lines: active,
    discount: coupon?.discount ?? 0,
    shipping: active.length ? standard.fee : 0,
    settings,
  });

  const strip = ({ categoryId: _c, ...l }: CartLine & { categoryId: string }): CartLine => l;
  return {
    items: [...active, ...unavailable].map(strip),
    saved: saved.map(strip),
    count: active.reduce((s, l) => s + l.quantity, 0),
    coupon,
    couponError,
    totals,
    freeShippingRemaining:
      settings.freeShippingThreshold > 0 && standard.fee > 0
        ? Math.max(0, settings.freeShippingThreshold - subtotal)
        : null,
  };
}

export async function getCartView() {
  return buildCartView(await findCart());
}

export async function reloadCartView(cartId: string) {
  const cart = await db.cart.findUnique({ where: { id: cartId }, include: cartInclude });
  return buildCartView(cart);
}

/** Merge a guest cart into the user's cart after sign-in. */
export async function mergeGuestCartInto(userId: string) {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (!token) return;
  const guest = await db.cart.findUnique({ where: { guestToken: token }, include: { items: true } });
  jar.delete(CART_COOKIE);
  if (!guest) return;
  const userCart =
    (await db.cart.findUnique({ where: { userId } })) ?? (await db.cart.create({ data: { userId } }));
  for (const item of guest.items) {
    await db.cartItem.upsert({
      where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
      create: {
        cartId: userCart.id,
        productId: item.productId,
        quantity: item.quantity,
        savedForLater: item.savedForLater,
      },
      update: {},
    });
  }
  if (guest.couponCode && !userCart.couponCode) {
    await db.cart.update({ where: { id: userCart.id }, data: { couponCode: guest.couponCode } });
  }
  await db.cart.delete({ where: { id: guest.id } });
}
