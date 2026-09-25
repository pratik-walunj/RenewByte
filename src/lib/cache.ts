import "server-only";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

/** Cache tags for catalogue data. Admin mutations revalidate these. */
export const TAGS = {
  catalog: "catalog",
  brands: "brands",
  categories: "categories",
  settings: "store-settings",
  product: (slug: string) => `product:${slug}`,
} as const;

/**
 * Cache a data-fetching function in the Next.js data cache. Catalogue reads are
 * cached for five minutes and invalidated immediately by admin mutations.
 */
export function cached<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  keyParts: string[],
  options: { tags: string[]; revalidate?: number },
) {
  return unstable_cache(fn, keyParts, { tags: options.tags, revalidate: options.revalidate ?? 300 });
}

/** Expire catalogue caches after an admin change. */
export function invalidateCatalog(extraTags: string[] = []) {
  for (const tag of [TAGS.catalog, ...extraTags]) revalidateTag(tag, { expire: 0 });
  revalidatePath("/", "layout");
}
