"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { limitByIp } from "@/lib/rate-limit";
import { cleanText } from "@/lib/security";

const schema = z.object({
  productId: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional().or(z.literal("")),
  body: z.string().trim().min(20, "Please write at least 20 characters").max(2000),
});

/** Reviews are held for moderation. Only signed-in customers may review; one review per product. */
export async function submitReview(input: z.input<typeof schema>) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please sign in to write a review." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Please check your review.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!(await limitByIp("review", 5, 60 * 60_000)).ok) {
    return { ok: false as const, error: "Too many reviews submitted. Please try again later." };
  }

  const { productId, rating, title, body } = parsed.data;
  const product = await db.product.findFirst({ where: { id: productId, status: "PUBLISHED" }, select: { id: true } });
  if (!product) return { ok: false as const, error: "Product not found." };

  const existing = await db.review.findUnique({ where: { productId_userId: { productId, userId: user.id } } });
  if (existing) return { ok: false as const, error: "You've already reviewed this laptop." };

  const purchased = await db.orderItem.count({
    where: {
      productId,
      order: { userId: user.id, status: { in: ["PAID", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] } },
    },
  });

  await db.review.create({
    data: {
      productId,
      userId: user.id,
      authorName: user.name.split(" ")[0] + (user.name.split(" ")[1] ? ` ${user.name.split(" ")[1][0]}.` : ""),
      rating,
      title: title ? cleanText(title, 80) : null,
      body: cleanText(body, 2000),
      isVerifiedPurchase: purchased > 0,
      status: "PENDING",
    },
  });
  return { ok: true as const };
}
