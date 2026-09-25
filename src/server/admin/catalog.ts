import "server-only";
import { db } from "@/lib/db";
import type { TaxonomyValues } from "@/server/admin/schemas/taxonomy";

export type TaxonomyRow = {
  id: string;
  productCount: number;
  values: TaxonomyValues;
};

export async function listTaxonomies() {
  const [brands, categories] = await Promise.all([
    db.brand.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } }),
  ]);
  const common = (r: {
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
    sortOrder: number;
    seoTitle: string | null;
    seoDescription: string | null;
  }) => ({
    name: r.name,
    slug: r.slug,
    description: r.description ?? "",
    isActive: r.isActive,
    sortOrder: r.sortOrder,
    seoTitle: r.seoTitle ?? "",
    seoDescription: r.seoDescription ?? "",
  });
  return {
    brands: brands.map<TaxonomyRow>((b) => ({
      id: b.id,
      productCount: b._count.products,
      values: { kind: "brand", ...common(b), imageUrl: b.logoUrl ?? "" },
    })),
    categories: categories.map<TaxonomyRow>((c) => ({
      id: c.id,
      productCount: c._count.products,
      values: { kind: "category", ...common(c), imageUrl: c.imageUrl ?? "" },
    })),
  };
}
