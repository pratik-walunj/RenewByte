"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { invalidateCatalog, TAGS } from "@/lib/cache";
import { authorize, failure } from "@/server/admin/guard";
import { recomputeRating } from "@/server/admin/reviews";
import type { ActionResult } from "@/server/admin/types";

const idSchema = z.string().min(1).max(64);

export async function moderateReview(id: string, status: string): Promise<ActionResult> {
  const { user, denied } = await authorize();
  if (!user) return denied;
  const parsed = z.object({ id: idSchema, status: z.enum(["PENDING", "APPROVED", "REJECTED"]) }).safeParse({ id, status });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  try {
    const review = await db.review.update({ where: { id }, data: { status: parsed.data.status }, select: { productId: true } });
    const product = await recomputeRating(review.productId);
    invalidateCatalog([TAGS.product(product.slug)]);
    const label = { PENDING: "moved back to pending", APPROVED: "approved", REJECTED: "rejected" }[parsed.data.status];
    return { ok: true, message: `Review ${label}` };
  } catch (e) {
    return failure("moderateReview", e);
  }
}

export async function deleteReview(id: string): Promise<ActionResult> {
  const { user, denied } = await authorize();
  if (!user) return denied;
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid request." };
  try {
    const review = await db.review.delete({ where: { id }, select: { productId: true } });
    const product = await recomputeRating(review.productId);
    invalidateCatalog([TAGS.product(product.slug)]);
    return { ok: true, message: "Review deleted" };
  } catch (e) {
    return failure("deleteReview", e);
  }
}
