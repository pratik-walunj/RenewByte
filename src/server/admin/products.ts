import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { paiseToRupees } from "@/lib/format";
import { toDateInput } from "@/server/admin/dates";
import { ADMIN_PAGE_SIZE, pageInfo } from "@/server/admin/pagination";
import type { ProductFormValues } from "@/server/admin/schemas/product";
import { productIdsWithStock, type StockFilter } from "@/server/admin/stock";

export type ProductListFilters = {
  q: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "";
  brand: string;
  category: string;
  stock: StockFilter | "";
  page: number;
};

export async function listProducts(f: ProductListFilters) {
  const where: Prisma.ProductWhereInput = {};
  if (f.q) {
    where.OR = [
      { name: { contains: f.q, mode: "insensitive" } },
      { sku: { contains: f.q, mode: "insensitive" } },
      { slug: { contains: f.q, mode: "insensitive" } },
    ];
  }
  if (f.status) where.status = f.status;
  if (f.brand) where.brandId = f.brand;
  if (f.category) where.categoryId = f.category;
  if (f.stock) where.id = { in: await productIdsWithStock(f.stock) };

  const total = await db.product.count({ where });
  const info = pageInfo(total, f.page);
  const rows = await db.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (info.page - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      status: true,
      price: true,
      mrp: true,
      conditionGrade: true,
      isFeatured: true,
      isBestSeller: true,
      isDeal: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      inventory: { select: { quantity: true, reserved: true, lowStockThreshold: true } },
    },
  });
  return { rows, info };
}

export type AdminProductRow = Awaited<ReturnType<typeof listProducts>>["rows"][number];

export async function getCatalogOptions() {
  const [brands, categories] = await Promise.all([
    db.brand.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  return {
    brands: brands.map((b) => ({ value: b.id, label: b.name })),
    categories: categories.map((c) => ({ value: c.id, label: c.name })),
  };
}

/** Load a product and map it onto the form's shape (rupees, list items as {value}). */
export async function getProductForEdit(id: string) {
  const p = await db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      inventory: true,
      _count: { select: { orderItems: true } },
    },
  });
  if (!p) return null;
  const list = (items: string[]) => items.map((value) => ({ value }));
  const values: ProductFormValues = {
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    brandId: p.brandId,
    categoryId: p.categoryId,
    status: p.status,
    shortDescription: p.shortDescription ?? "",
    description: p.description ?? "",
    mrpRupees: paiseToRupees(p.mrp),
    priceRupees: paiseToRupees(p.price),
    conditionGrade: p.conditionGrade,
    warrantyMonths: p.warrantyMonths,
    batteryHealth: p.batteryHealth,
    batteryBackup: p.batteryBackup ?? "",
    processor: p.processor,
    processorBrand: p.processorBrand,
    processorFamily: p.processorFamily,
    processorGeneration: p.processorGeneration ?? "",
    ramGb: p.ramGb,
    ramType: p.ramType ?? "",
    storageGb: p.storageGb,
    storageType: p.storageType,
    displaySize: p.displaySize,
    resolution: p.resolution ?? "",
    displayType: p.displayType ?? "",
    graphics: p.graphics,
    gpuType: p.gpuType,
    operatingSystem: p.operatingSystem,
    weightKg: p.weightKg,
    color: p.color ?? "",
    keyboard: p.keyboard ?? "",
    highlights: list(p.highlights),
    features: list(p.features),
    ports: list(p.ports),
    whatsIncluded: list(p.whatsIncluded),
    specifications: p.specifications.map((s) => ({ group: s.group, label: s.label, value: s.value })),
    images: p.images.map((i) => ({ url: i.url, alt: i.alt, publicId: i.publicId })),
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isDeal: p.isDeal,
    dealEndsAt: toDateInput(p.dealEndsAt),
    quantity: p.inventory?.quantity ?? 0,
    lowStockThreshold: p.inventory?.lowStockThreshold ?? 3,
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
  };
  return {
    values,
    meta: {
      id: p.id,
      slug: p.slug,
      status: p.status,
      updatedAt: p.updatedAt,
      orderItemCount: p._count.orderItems,
      stock: p.inventory ? { quantity: p.inventory.quantity, reserved: p.inventory.reserved } : null,
    },
  };
}
