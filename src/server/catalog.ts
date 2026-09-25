import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { cached, TAGS } from "@/lib/cache";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { OS_FAMILIES, SCREEN_BUCKETS, tokenSlug, type CatalogFilters } from "@/lib/filters";
import type { Prisma } from "@/generated/prisma/client";
import type { ProductCardData, ProductDetailData, StockState } from "@/lib/types";

// ─── Shapes ─────────────────────────────────────────────────

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  sku: true,
  processor: true,
  processorFamily: true,
  processorGeneration: true,
  ramGb: true,
  storageGb: true,
  storageType: true,
  displaySize: true,
  resolution: true,
  graphics: true,
  operatingSystem: true,
  batteryHealth: true,
  weightKg: true,
  conditionGrade: true,
  mrp: true,
  price: true,
  discountPercent: true,
  warrantyMonths: true,
  ratingAvg: true,
  ratingCount: true,
  isDeal: true,
  isBestSeller: true,
  dealEndsAt: true,
  isDemo: true,
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 2 },
  inventory: { select: { quantity: true, reserved: true, lowStockThreshold: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export function stockState(inv: { quantity: number; reserved: number; lowStockThreshold: number } | null): {
  state: StockState;
  available: number;
} {
  const available = inv ? Math.max(0, inv.quantity - inv.reserved) : 0;
  if (available <= 0) return { state: "out", available: 0 };
  if (available <= (inv?.lowStockThreshold ?? 3)) return { state: "low", available };
  return { state: "in", available };
}

function toCard(p: CardRow): ProductCardData {
  const stock = stockState(p.inventory);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    brand: p.brand,
    category: p.category,
    processor: p.processor,
    processorFamily: p.processorFamily,
    processorGeneration: p.processorGeneration,
    ramGb: p.ramGb,
    storageGb: p.storageGb,
    storageType: p.storageType,
    displaySize: p.displaySize,
    resolution: p.resolution,
    graphics: p.graphics,
    operatingSystem: p.operatingSystem,
    batteryHealth: p.batteryHealth,
    weightKg: p.weightKg,
    conditionGrade: p.conditionGrade,
    mrp: p.mrp,
    price: p.price,
    discountPercent: p.discountPercent,
    warrantyMonths: p.warrantyMonths,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    isDeal: p.isDeal,
    isBestSeller: p.isBestSeller,
    isDemo: p.isDemo,
    dealEndsAt: p.dealEndsAt ? p.dealEndsAt.toISOString() : null,
    image: p.images[0] ?? null,
    hoverImage: p.images[1] ?? null,
    stock: stock.state,
    available: stock.available,
  };
}

const PUBLISHED: Prisma.ProductWhereInput = { status: "PUBLISHED" };

// ─── Filtering ──────────────────────────────────────────────

function buildWhere(f: CatalogFilters): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [PUBLISHED];

  if (f.q) {
    const terms = f.q.split(/\s+/).filter(Boolean).slice(0, 6);
    for (const term of terms) {
      and.push({
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { sku: { contains: term, mode: "insensitive" } },
          { processor: { contains: term, mode: "insensitive" } },
          { processorFamily: { contains: term, mode: "insensitive" } },
          { graphics: { contains: term, mode: "insensitive" } },
          { brand: { name: { contains: term, mode: "insensitive" } } },
          { category: { name: { contains: term, mode: "insensitive" } } },
        ],
      });
    }
  }
  if (f.brand.length) and.push({ brand: { slug: { in: f.brand } } });
  if (f.category.length) and.push({ category: { slug: { in: f.category } } });
  if (f.min !== undefined) and.push({ price: { gte: f.min * 100 } });
  if (f.max !== undefined) and.push({ price: { lte: f.max * 100 } });
  if (f.ram.length) and.push({ ramGb: { in: f.ram } });
  if (f.storage.length) and.push({ storageGb: { in: f.storage } });
  if (f.ssd) and.push({ storageType: { in: ["NVME_SSD", "SSD"] } });
  if (f.gpu) and.push({ gpuType: f.gpu === "dedicated" ? "DEDICATED" : "INTEGRATED" });
  if (f.condition.length) and.push({ conditionGrade: { in: f.condition } });
  if (f.warranty) and.push({ warrantyMonths: { gte: f.warranty } });
  if (f.deal) and.push({ isDeal: true });
  if (f.inStock) {
    and.push({ inventory: { is: { quantity: { gt: db.inventory.fields.reserved } } } });
  }
  if (f.screen.length) {
    and.push({
      OR: SCREEN_BUCKETS.filter((b) => f.screen.includes(b.slug)).map((b) => ({
        displaySize: { gte: b.min, lt: b.max },
      })),
    });
  }
  if (f.os.length) {
    and.push({
      OR: OS_FAMILIES.filter((o) => f.os.includes(o.slug)).map((o) => ({
        operatingSystem: { contains: o.match, mode: "insensitive" as const },
      })),
    });
  }
  // Processor family and generation are free text in the DB; match against the
  // normalised slugs produced by the facet list.
  return { AND: and };
}

function orderBy(sort: CatalogFilters["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price-asc":
      return [{ price: "asc" }];
    case "price-desc":
      return [{ price: "desc" }];
    case "best-selling":
      return [{ soldCount: "desc" }, { createdAt: "desc" }];
    case "discount":
      return [{ discountPercent: "desc" }, { price: "asc" }];
    default:
      return [{ isFeatured: "desc" }, { isBestSeller: "desc" }, { createdAt: "desc" }];
  }
}

/** Resolve processor/generation slugs to their stored values using the facet index. */
async function resolveTextFilters(f: CatalogFilters) {
  const extra: Prisma.ProductWhereInput[] = [];
  if (!f.processor.length && !f.gen.length) return extra;
  const facets = await getFacets();
  if (f.processor.length) {
    const values = facets.processors.filter((o) => f.processor.includes(o.slug)).map((o) => o.label);
    extra.push({ processorFamily: { in: values.length ? values : ["__none__"] } });
  }
  if (f.gen.length) {
    const values = facets.generations.filter((o) => f.gen.includes(o.slug)).map((o) => o.label);
    extra.push({ processorGeneration: { in: values.length ? values : ["__none__"] } });
  }
  return extra;
}

export async function listProducts(filters: CatalogFilters, perPage = PRODUCTS_PER_PAGE) {
  const base = buildWhere(filters);
  const extra = await resolveTextFilters(filters);
  const where: Prisma.ProductWhereInput = extra.length
    ? { AND: [...(base.AND as Prisma.ProductWhereInput[]), ...extra] }
    : base;
  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      select: cardSelect,
      orderBy: orderBy(filters.sort),
      skip: (filters.page - 1) * perPage,
      take: perPage,
    }),
  ]);
  return {
    items: rows.map(toCard),
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

// ─── Facets ─────────────────────────────────────────────────

export type FacetOption = { slug: string; label: string; count: number };

export type FacetScope = { brand?: string; category?: string; deal?: boolean; min?: number; max?: number };

export const getFacets = cached(
  async (scope: FacetScope = {}) => {
    const rows = await db.product.findMany({
      where: {
        ...PUBLISHED,
        ...(scope.brand ? { brand: { slug: scope.brand } } : {}),
        ...(scope.category ? { category: { slug: scope.category } } : {}),
        ...(scope.deal ? { isDeal: true } : {}),
        ...(scope.min !== undefined || scope.max !== undefined
          ? {
              price: {
                ...(scope.min !== undefined ? { gte: scope.min * 100 } : {}),
                ...(scope.max !== undefined ? { lte: scope.max * 100 } : {}),
              },
            }
          : {}),
      },
      select: {
        price: true,
        processorFamily: true,
        processorGeneration: true,
        ramGb: true,
        storageGb: true,
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
      },
    });
    const tally = (values: { slug: string; label: string }[]) => {
      const map = new Map<string, FacetOption>();
      for (const v of values) {
        const cur = map.get(v.slug);
        if (cur) cur.count += 1;
        else map.set(v.slug, { ...v, count: 1 });
      }
      return [...map.values()];
    };
    const numeric = (values: number[]) => {
      const map = new Map<number, number>();
      for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
      return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([value, count]) => ({ value, count }));
    };
    const prices = rows.map((r) => r.price);
    const genNum = (s: string) => Number.parseInt(s, 10) || 0;
    return {
      brands: tally(rows.map((r) => ({ slug: r.brand.slug, label: r.brand.name }))).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
      categories: tally(rows.map((r) => ({ slug: r.category.slug, label: r.category.name }))).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
      processors: tally(rows.map((r) => ({ slug: tokenSlug(r.processorFamily), label: r.processorFamily }))).sort(
        (a, b) => a.label.localeCompare(b.label),
      ),
      generations: tally(
        rows
          .filter((r) => r.processorGeneration)
          .map((r) => ({ slug: tokenSlug(r.processorGeneration!), label: r.processorGeneration! })),
      ).sort((a, b) => genNum(b.label) - genNum(a.label) || a.label.localeCompare(b.label)),
      ram: numeric(rows.map((r) => r.ramGb)),
      storage: numeric(rows.map((r) => r.storageGb)),
      priceRange: {
        min: prices.length ? Math.floor(Math.min(...prices) / 100) : 0,
        max: prices.length ? Math.ceil(Math.max(...prices) / 100) : 0,
      },
      total: rows.length,
    };
  },
  ["catalog-facets"],
  { tags: [TAGS.catalog] },
);

export type Facets = Awaited<ReturnType<typeof getFacets>>;

// ─── Collections used on landing pages ──────────────────────

export const getBestSellers = cached(
  async (limit: number) => {
    const rows = await db.product.findMany({
      where: { ...PUBLISHED, isBestSeller: true },
      select: cardSelect,
      orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
    return rows.map(toCard);
  },
  ["best-sellers"],
  { tags: [TAGS.catalog] },
);

export const getFeaturedProducts = cached(
  async (limit: number) => {
    const rows = await db.product.findMany({
      where: { ...PUBLISHED, isFeatured: true },
      select: cardSelect,
      orderBy: [{ updatedAt: "desc" }],
      take: limit,
    });
    return rows.map(toCard);
  },
  ["featured-products"],
  { tags: [TAGS.catalog] },
);

export const getDeals = cached(
  async (limit: number) => {
    const now = new Date();
    const rows = await db.product.findMany({
      where: { ...PUBLISHED, isDeal: true, OR: [{ dealEndsAt: null }, { dealEndsAt: { gt: now } }] },
      select: cardSelect,
      orderBy: [{ discountPercent: "desc" }, { price: "asc" }],
      take: limit,
    });
    return rows.map(toCard);
  },
  ["deals"],
  { tags: [TAGS.catalog], revalidate: 120 },
);

export const getProductsBySlugs = async (slugs: string[]) => {
  if (!slugs.length) return [];
  const rows = await db.product.findMany({
    where: { ...PUBLISHED, slug: { in: slugs.slice(0, 50) } },
    select: cardSelect,
  });
  const cards = rows.map(toCard);
  return slugs.map((s) => cards.find((c) => c.slug === s)).filter((c): c is ProductCardData => !!c);
};

export const getProductsByIds = async (ids: string[]) => {
  if (!ids.length) return [];
  const rows = await db.product.findMany({
    where: { ...PUBLISHED, id: { in: ids.slice(0, 100) } },
    select: cardSelect,
  });
  const cards = rows.map(toCard);
  return ids.map((id) => cards.find((c) => c.id === id)).filter((c): c is ProductCardData => !!c);
};

// ─── Brands & categories ────────────────────────────────────

export const getBrandsWithStats = cached(
  async () => {
    const brands = await db.brand.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        seoTitle: true,
        seoDescription: true,
        products: { where: PUBLISHED, select: { price: true } },
      },
    });
    return brands.map(({ products, ...b }) => ({
      ...b,
      productCount: products.length,
      fromPrice: products.length ? Math.min(...products.map((p) => p.price)) : null,
    }));
  },
  ["brands-with-stats"],
  { tags: [TAGS.catalog, TAGS.brands] },
);

export const getCategoriesWithStats = cached(
  async () => {
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        seoTitle: true,
        seoDescription: true,
        products: { where: PUBLISHED, select: { price: true } },
      },
    });
    return categories.map(({ products, ...c }) => ({
      ...c,
      productCount: products.length,
      fromPrice: products.length ? Math.min(...products.map((p) => p.price)) : null,
    }));
  },
  ["categories-with-stats"],
  { tags: [TAGS.catalog, TAGS.categories] },
);

export type BrandWithStats = Awaited<ReturnType<typeof getBrandsWithStats>>[number];
export type CategoryWithStats = Awaited<ReturnType<typeof getCategoriesWithStats>>[number];

export async function getBrand(slug: string) {
  return (await getBrandsWithStats()).find((b) => b.slug === slug) ?? null;
}

export async function getCategory(slug: string) {
  return (await getCategoriesWithStats()).find((c) => c.slug === slug) ?? null;
}

// ─── Product detail ─────────────────────────────────────────

const fetchProduct = cached(
  async (slug: string): Promise<ProductDetailData | null> => {
    const p = await db.product.findFirst({
      where: { slug, ...PUBLISHED },
      include: {
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" } },
        specifications: { orderBy: [{ sortOrder: "asc" }] },
        inventory: { select: { quantity: true, reserved: true, lowStockThreshold: true } },
      },
    });
    if (!p) return null;
    const stock = stockState(p.inventory);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      sku: p.sku,
      brand: p.brand,
      category: p.category,
      shortDescription: p.shortDescription,
      description: p.description,
      mrp: p.mrp,
      price: p.price,
      discountPercent: p.discountPercent,
      conditionGrade: p.conditionGrade,
      warrantyMonths: p.warrantyMonths,
      processor: p.processor,
      processorBrand: p.processorBrand,
      processorFamily: p.processorFamily,
      processorGeneration: p.processorGeneration,
      ramGb: p.ramGb,
      ramType: p.ramType,
      storageGb: p.storageGb,
      storageType: p.storageType,
      displaySize: p.displaySize,
      resolution: p.resolution,
      displayType: p.displayType,
      graphics: p.graphics,
      gpuType: p.gpuType,
      operatingSystem: p.operatingSystem,
      batteryHealth: p.batteryHealth,
      batteryBackup: p.batteryBackup,
      weightKg: p.weightKg,
      color: p.color,
      keyboard: p.keyboard,
      ports: p.ports,
      features: p.features,
      highlights: p.highlights,
      whatsIncluded: p.whatsIncluded,
      isDeal: p.isDeal,
      isBestSeller: p.isBestSeller,
      isDemo: p.isDemo,
      dealEndsAt: p.dealEndsAt?.toISOString() ?? null,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      updatedAt: p.updatedAt.toISOString(),
      images: p.images.map((i) => ({ url: i.url, alt: i.alt, width: i.width, height: i.height })),
      specifications: p.specifications.map((s) => ({ group: s.group, label: s.label, value: s.value })),
      stock: stock.state,
      available: stock.available,
      image: p.images[0] ? { url: p.images[0].url, alt: p.images[0].alt } : null,
      hoverImage: p.images[1] ? { url: p.images[1].url, alt: p.images[1].alt } : null,
    };
  },
  ["product-detail"],
  { tags: [TAGS.catalog] },
);

export const getProductBySlug = cache((slug: string) => fetchProduct(slug));

export const getRelatedProducts = cached(
  async (productId: string, categorySlug: string, brandSlug: string, price: number) => {
    const rows = await db.product.findMany({
      where: {
        ...PUBLISHED,
        id: { not: productId },
        OR: [{ category: { slug: categorySlug } }, { brand: { slug: brandSlug } }],
        price: { gte: Math.round(price * 0.6), lte: Math.round(price * 1.5) },
      },
      select: cardSelect,
      orderBy: [{ isBestSeller: "desc" }, { soldCount: "desc" }],
      take: 8,
    });
    return rows.map(toCard);
  },
  ["related-products"],
  { tags: [TAGS.catalog] },
);

export async function getProductReviews(productId: string) {
  const [reviews, distribution] = await Promise.all([
    db.review.findMany({
      where: { productId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        authorName: true,
        rating: true,
        title: true,
        body: true,
        isVerifiedPurchase: true,
        createdAt: true,
      },
    }),
    db.review.groupBy({
      by: ["rating"],
      where: { productId, status: "APPROVED" },
      _count: { _all: true },
    }),
  ]);
  const dist = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: distribution.find((d) => d.rating === r)?._count._all ?? 0,
  }));
  return { reviews, distribution: dist };
}

/** Recent approved reviews across the store (homepage social proof). */
export const getRecentReviews = cached(
  async (limit: number) => {
    const rows = await db.review.findMany({
      where: { status: "APPROVED", rating: { gte: 4 } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        authorName: true,
        rating: true,
        title: true,
        body: true,
        isVerifiedPurchase: true,
        createdAt: true,
        product: { select: { name: true, slug: true } },
      },
    });
    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  },
  ["recent-reviews"],
  { tags: [TAGS.catalog], revalidate: 600 },
);

// ─── Search suggestions ─────────────────────────────────────

export async function searchSuggestions(q: string) {
  const term = q.trim().slice(0, 60);
  if (term.length < 2) return { products: [], brands: [], categories: [] };
  const [products, brands, categories] = await Promise.all([
    db.product.findMany({
      where: {
        ...PUBLISHED,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { sku: { contains: term, mode: "insensitive" } },
          { processor: { contains: term, mode: "insensitive" } },
          { processorFamily: { contains: term, mode: "insensitive" } },
          { brand: { name: { contains: term, mode: "insensitive" } } },
          { category: { name: { contains: term, mode: "insensitive" } } },
        ],
      },
      select: {
        slug: true,
        name: true,
        price: true,
        processor: true,
        ramGb: true,
        storageGb: true,
        conditionGrade: true,
        brand: { select: { name: true } },
        images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: [{ isBestSeller: "desc" }, { soldCount: "desc" }],
      take: 6,
    }),
    db.brand.findMany({
      where: { isActive: true, name: { contains: term, mode: "insensitive" } },
      select: { name: true, slug: true },
      take: 3,
    }),
    db.category.findMany({
      where: { isActive: true, name: { contains: term, mode: "insensitive" } },
      select: { name: true, slug: true },
      take: 3,
    }),
  ]);
  return {
    products: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      brand: p.brand.name,
      price: p.price,
      specs: `${p.processor} · ${p.ramGb}GB · ${p.storageGb >= 1024 ? `${p.storageGb / 1024}TB` : `${p.storageGb}GB`}`,
      grade: p.conditionGrade,
      image: p.images[0] ?? null,
    })),
    brands,
    categories,
  };
}

export type SearchSuggestions = Awaited<ReturnType<typeof searchSuggestions>>;
