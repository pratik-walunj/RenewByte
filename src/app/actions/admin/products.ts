"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { invalidateCatalog, TAGS } from "@/lib/cache";
import { cleanText } from "@/lib/security";
import { discountPercent, rupeesToPaise } from "@/lib/format";
import { authorize, failure, invalid, isUniqueViolation } from "@/server/admin/guard";
import { fromDateInput } from "@/server/admin/dates";
import { productSchema, type ProductFormValues } from "@/server/admin/schemas/product";
import type { ActionFailure, ActionResult } from "@/server/admin/types";

const idSchema = z.string().min(1).max(64);
const orNull = (v: string) => (v.trim() ? v.trim() : null);
const strings = (items: { value: string }[]) => items.map((i) => cleanText(i.value, 200)).filter(Boolean);

function toProductData(v: ProductFormValues) {
  const mrp = rupeesToPaise(v.mrpRupees);
  const price = rupeesToPaise(v.priceRupees);
  return {
    name: cleanText(v.name, 160),
    slug: v.slug,
    sku: v.sku.toUpperCase(),
    brandId: v.brandId,
    categoryId: v.categoryId,
    status: v.status,
    shortDescription: orNull(cleanText(v.shortDescription, 300)),
    description: orNull(cleanText(v.description, 10_000)),
    mrp,
    price,
    discountPercent: discountPercent(mrp, price),
    conditionGrade: v.conditionGrade,
    warrantyMonths: v.warrantyMonths,
    batteryHealth: v.batteryHealth,
    batteryBackup: orNull(v.batteryBackup),
    processor: v.processor,
    processorBrand: v.processorBrand,
    processorFamily: v.processorFamily,
    processorGeneration: orNull(v.processorGeneration),
    ramGb: v.ramGb,
    ramType: orNull(v.ramType),
    storageGb: v.storageGb,
    storageType: v.storageType,
    displaySize: v.displaySize,
    resolution: orNull(v.resolution),
    displayType: orNull(v.displayType),
    graphics: v.graphics,
    gpuType: v.gpuType,
    operatingSystem: v.operatingSystem,
    weightKg: v.weightKg,
    color: orNull(v.color),
    keyboard: orNull(v.keyboard),
    highlights: strings(v.highlights),
    features: strings(v.features),
    ports: strings(v.ports),
    whatsIncluded: strings(v.whatsIncluded),
    isFeatured: v.isFeatured,
    isBestSeller: v.isBestSeller,
    isDeal: v.isDeal,
    dealEndsAt: v.isDeal && v.dealEndsAt ? fromDateInput(v.dealEndsAt, "end") : null,
    seoTitle: orNull(v.seoTitle),
    seoDescription: orNull(v.seoDescription),
  } satisfies Prisma.ProductUncheckedCreateInput;
}

function childRows(v: ProductFormValues) {
  return {
    images: v.images.map((img, i) => ({
      url: img.url,
      alt: cleanText(img.alt, 160),
      publicId: img.publicId,
      sortOrder: i,
    })),
    specifications: v.specifications.map((s, i) => ({
      group: s.group.trim() || "General",
      label: cleanText(s.label, 80),
      value: cleanText(s.value, 200),
      sortOrder: i,
    })),
  };
}

function uniqueError(e: unknown): ActionFailure | null {
  if (isUniqueViolation(e, "slug")) {
    return { ok: false, error: "That slug is already used by another product.", fieldErrors: { slug: ["This slug is already taken."] } };
  }
  if (isUniqueViolation(e, "sku")) {
    return { ok: false, error: "That SKU is already used by another product.", fieldErrors: { sku: ["This SKU is already taken."] } };
  }
  return null;
}

/** Create (id = null) or update a product. The form's Zod schema is re-applied here. */
export async function saveProduct(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await authorize();
  if (!user) return denied;
  if (id !== null && !idSchema.safeParse(id).success) return { ok: false, error: "Invalid product." };
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const v = parsed.data;
  const data = toProductData(v);
  const children = childRows(v);

  const [brand, category] = await Promise.all([
    db.brand.findUnique({ where: { id: v.brandId }, select: { id: true } }),
    db.category.findUnique({ where: { id: v.categoryId }, select: { id: true } }),
  ]);
  if (!brand) return { ok: false, error: "Choose a brand.", fieldErrors: { brandId: ["That brand no longer exists."] } };
  if (!category) return { ok: false, error: "Choose a category.", fieldErrors: { categoryId: ["That category no longer exists."] } };

  try {
    if (id === null) {
      const created = await db.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            ...data,
            images: { create: children.images },
            specifications: { create: children.specifications },
            inventory: { create: { quantity: v.quantity, lowStockThreshold: v.lowStockThreshold } },
          },
          include: { inventory: { select: { id: true } } },
        });
        if (v.quantity > 0 && product.inventory) {
          await tx.inventoryAdjustment.create({
            data: { inventoryId: product.inventory.id, change: v.quantity, reason: "Initial stock", userId: user.id },
          });
        }
        return product;
      });
      invalidateCatalog([TAGS.product(created.slug)]);
      return { ok: true, id: created.id, message: "Product created" };
    }

    const before = await db.product.findUnique({ where: { id }, select: { slug: true } });
    if (!before) return { ok: false, error: "This product no longer exists." };
    await db.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data });
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (children.images.length) {
        await tx.productImage.createMany({ data: children.images.map((i) => ({ ...i, productId: id })) });
      }
      await tx.productSpecification.deleteMany({ where: { productId: id } });
      if (children.specifications.length) {
        await tx.productSpecification.createMany({ data: children.specifications.map((s) => ({ ...s, productId: id })) });
      }
      await tx.inventory.upsert({
        where: { productId: id },
        create: { productId: id, quantity: 0, lowStockThreshold: v.lowStockThreshold },
        update: {},
      });
    });
    invalidateCatalog([TAGS.product(before.slug), TAGS.product(data.slug)]);
    return { ok: true, id, message: "Product saved" };
  } catch (e) {
    return uniqueError(e) ?? failure("saveProduct", e);
  }
}

async function uniqueValue(base: string, field: "slug" | "sku") {
  for (let n = 1; n < 50; n++) {
    const suffix = field === "slug" ? (n === 1 ? "-copy" : `-copy-${n}`) : n === 1 ? "-COPY" : `-COPY${n}`;
    const candidate = `${base.slice(0, (field === "slug" ? 120 : 64) - suffix.length)}${suffix}`;
    const exists = await db.product.findFirst({ where: { [field]: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Copy a product as a new draft with no stock. */
export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await authorize();
  if (!user) return denied;
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid product." };

  const p = await db.product.findUnique({ where: { id }, include: { images: true, specifications: true, inventory: true } });
  if (!p) return { ok: false, error: "This product no longer exists." };

  const {
    id: _id,
    createdAt: _c,
    updatedAt: _u,
    images,
    specifications,
    inventory,
    soldCount: _s,
    ratingAvg: _ra,
    ratingCount: _rc,
    isDemo: _d,
    ...rest
  } = p;
  try {
    const copy = await db.product.create({
      data: {
        ...rest,
        name: `${p.name} (copy)`.slice(0, 160),
        slug: await uniqueValue(p.slug, "slug"),
        sku: await uniqueValue(p.sku, "sku"),
        status: "DRAFT",
        images: {
          create: images.map((i) => ({ url: i.url, alt: i.alt, width: i.width, height: i.height, publicId: i.publicId, sortOrder: i.sortOrder })),
        },
        specifications: {
          create: specifications.map((s) => ({ group: s.group, label: s.label, value: s.value, sortOrder: s.sortOrder })),
        },
        inventory: { create: { quantity: 0, lowStockThreshold: inventory?.lowStockThreshold ?? 3 } },
      },
    });
    invalidateCatalog();
    return { ok: true, id: copy.id, message: "Draft copy created" };
  } catch (e) {
    return uniqueError(e) ?? failure("duplicateProduct", e);
  }
}

/** Delete a product — or archive it when orders reference it (order history must stay intact). */
export async function deleteProduct(id: string): Promise<ActionResult<{ archived: boolean }>> {
  const { user, denied } = await authorize("ADMIN");
  if (!user) return denied;
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid product." };

  const p = await db.product.findUnique({ where: { id }, select: { slug: true, _count: { select: { orderItems: true } } } });
  if (!p) return { ok: false, error: "This product no longer exists." };
  try {
    if (p._count.orderItems > 0) {
      await db.product.update({ where: { id }, data: { status: "ARCHIVED", isFeatured: false, isBestSeller: false, isDeal: false } });
      invalidateCatalog([TAGS.product(p.slug)]);
      return { ok: true, archived: true, message: "This product has orders, so it was archived instead of deleted." };
    }
    await db.product.delete({ where: { id } });
    invalidateCatalog([TAGS.product(p.slug)]);
    return { ok: true, archived: false, message: "Product deleted" };
  } catch (e) {
    return failure("deleteProduct", e);
  }
}

const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export async function setProductStatus(id: string, status: string): Promise<ActionResult> {
  const { user, denied } = await authorize();
  if (!user) return denied;
  const parsed = z.object({ id: idSchema, status: statusSchema }).safeParse({ id, status });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const p = await db.product.findUnique({ where: { id }, select: { slug: true, _count: { select: { images: true } } } });
  if (!p) return { ok: false, error: "This product no longer exists." };
  if (parsed.data.status === "PUBLISHED" && p._count.images === 0) {
    return { ok: false, error: "Add at least one image before publishing." };
  }
  await db.product.update({ where: { id }, data: { status: parsed.data.status } });
  invalidateCatalog([TAGS.product(p.slug)]);
  const label = { DRAFT: "moved to drafts", PUBLISHED: "published", ARCHIVED: "archived" }[parsed.data.status];
  return { ok: true, message: `Product ${label}` };
}

const flagSchema = z.enum(["isFeatured", "isBestSeller", "isDeal"]);

export async function toggleProductFlag(id: string, flag: string, value: boolean): Promise<ActionResult> {
  const { user, denied } = await authorize();
  if (!user) return denied;
  const parsed = z.object({ id: idSchema, flag: flagSchema, value: z.boolean() }).safeParse({ id, flag, value });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  try {
    const p = await db.product.update({
      where: { id },
      data: { [parsed.data.flag]: parsed.data.value, ...(parsed.data.flag === "isDeal" && !value ? { dealEndsAt: null } : {}) },
      select: { slug: true },
    });
    invalidateCatalog([TAGS.product(p.slug)]);
    const label = { isFeatured: "Featured", isBestSeller: "Best seller", isDeal: "Deal" }[parsed.data.flag];
    return { ok: true, message: `${label} ${value ? "on" : "off"}` };
  } catch (e) {
    return failure("toggleProductFlag", e);
  }
}
