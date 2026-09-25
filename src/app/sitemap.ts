import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getAllLandingPages, getAllPosts, reader } from "@/lib/cms";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

const STATIC_PATHS = [
  "/",
  "/laptops",
  "/deals",
  "/blog",
  "/about",
  "/contact",
  "/warranty",
  "/returns",
  "/shipping",
  "/faq",
  "/how-we-refurbish",
  "/condition-grades",
  "/sell",
  "/track-order",
  "/privacy-policy",
  "/terms",
  "/careers",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" || path === "/laptops" || path === "/deals" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path === "/laptops" ? 0.9 : 0.5,
  }));

  const [posts, landings, pages] = await Promise.all([getAllPosts(), getAllLandingPages(), reader.collections.pages.list()]);
  for (const slug of pages) {
    if (!STATIC_PATHS.includes(`/${slug}`)) entries.push({ url: absoluteUrl(`/${slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.3 });
  }
  for (const p of posts) {
    entries.push({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: p.updatedAt || p.publishedAt || now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }
  for (const l of landings.filter((l) => l.kind === "listing")) {
    entries.push({ url: absoluteUrl(`/laptops/${l.slug}`), lastModified: now, changeFrequency: "daily", priority: 0.8 });
  }

  // Catalogue entries need the database; the sitemap still renders if it's unavailable.
  try {
    const [products, brands, categories] = await Promise.all([
      db.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true, images: { select: { url: true }, take: 1, orderBy: { sortOrder: "asc" } } } }),
      db.brand.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      db.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    ]);
    for (const b of brands) entries.push({ url: absoluteUrl(`/brand/${b.slug}`), lastModified: b.updatedAt, changeFrequency: "daily", priority: 0.8 });
    for (const c of categories) entries.push({ url: absoluteUrl(`/category/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "daily", priority: 0.8 });
    for (const p of products) {
      entries.push({
        url: absoluteUrl(`/laptops/${p.slug}`),
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
        images: p.images.map((i) => absoluteUrl(i.url)),
      });
    }
  } catch (err) {
    console.error("[sitemap] catalogue unavailable", err);
  }
  return entries;
}
