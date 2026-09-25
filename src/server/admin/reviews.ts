import "server-only";
import type { ReviewStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { ADMIN_PAGE_SIZE, pageInfo } from "@/server/admin/pagination";

export async function listReviews(status: ReviewStatus, page: number) {
  const [total, grouped] = await Promise.all([
    db.review.count({ where: { status } }),
    db.review.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const info = pageInfo(total, page);
  const rows = await db.review.findMany({
    where: { status },
    orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
    skip: (info.page - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
    include: {
      product: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, email: true } },
    },
  });
  const counts: Record<ReviewStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const g of grouped) counts[g.status] = g._count._all;
  return { rows, info, counts };
}

/** Recompute a product's rating from its approved reviews. */
export async function recomputeRating(productId: string) {
  const agg = await db.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const avg = agg._avg.rating ?? 0;
  return db.product.update({
    where: { id: productId },
    data: { ratingAvg: Math.round(avg * 10) / 10, ratingCount: agg._count._all },
    select: { slug: true },
  });
}
