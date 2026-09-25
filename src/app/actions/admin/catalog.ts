"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { invalidateCatalog, TAGS } from "@/lib/cache";
import { cleanText } from "@/lib/security";
import { authorize, failure, invalid, isForeignKeyViolation, isUniqueViolation } from "@/server/admin/guard";
import { taxonomySchema } from "@/server/admin/schemas/taxonomy";
import type { ActionResult } from "@/server/admin/types";

const idSchema = z.string().min(1).max(64);
const orNull = (v: string) => (v ? v : null);

/** Create or update a brand or category. */
export async function saveTaxonomy(id: string | null, input: unknown): Promise<ActionResult> {
  const { user, denied } = await authorize();
  if (!user) return denied;
  if (id !== null && !idSchema.safeParse(id).success) return { ok: false, error: "Invalid request." };
  const parsed = taxonomySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const common = {
    name: cleanText(v.name, 80),
    slug: v.slug,
    description: orNull(cleanText(v.description, 2000)),
    isActive: v.isActive,
    sortOrder: v.sortOrder,
    seoTitle: orNull(v.seoTitle),
    seoDescription: orNull(v.seoDescription),
  };
  try {
    if (v.kind === "brand") {
      const data = { ...common, logoUrl: orNull(v.imageUrl) };
      if (id) await db.brand.update({ where: { id }, data });
      else await db.brand.create({ data });
    } else {
      const data = { ...common, imageUrl: orNull(v.imageUrl) };
      if (id) await db.category.update({ where: { id }, data });
      else await db.category.create({ data });
    }
    invalidateCatalog([v.kind === "brand" ? TAGS.brands : TAGS.categories]);
    const noun = v.kind === "brand" ? "Brand" : "Category";
    return { ok: true, message: id ? `${noun} saved` : `${noun} created` };
  } catch (e) {
    if (isUniqueViolation(e, "slug")) return { ok: false, error: "That slug is taken.", fieldErrors: { slug: ["This slug is already in use."] } };
    if (isUniqueViolation(e, "name")) return { ok: false, error: "That name is taken.", fieldErrors: { name: ["This name is already in use."] } };
    return failure("saveTaxonomy", e);
  }
}

/** ADMIN only. Blocked while any product still references the brand/category. */
export async function deleteTaxonomy(kind: string, id: string): Promise<ActionResult> {
  const { user, denied } = await authorize("ADMIN");
  if (!user) return denied;
  const parsed = z.object({ kind: z.enum(["brand", "category"]), id: idSchema }).safeParse({ kind, id });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const count = await db.product.count({ where: parsed.data.kind === "brand" ? { brandId: id } : { categoryId: id } });
  if (count > 0) {
    return {
      ok: false,
      error: `${count} ${count === 1 ? "product uses" : "products use"} this ${parsed.data.kind}. Move or delete them first, or mark it inactive.`,
    };
  }
  try {
    if (parsed.data.kind === "brand") await db.brand.delete({ where: { id } });
    else await db.category.delete({ where: { id } });
    invalidateCatalog([parsed.data.kind === "brand" ? TAGS.brands : TAGS.categories]);
    return { ok: true, message: parsed.data.kind === "brand" ? "Brand deleted" : "Category deleted" };
  } catch (e) {
    if (isForeignKeyViolation(e)) return { ok: false, error: "It's still referenced by products, so it can't be deleted." };
    return failure("deleteTaxonomy", e);
  }
}
