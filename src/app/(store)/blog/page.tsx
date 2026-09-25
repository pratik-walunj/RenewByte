import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";
import { BLOG_CATEGORY_LABEL, getAllPosts } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-shell";
import { FeaturedPostCard, PostCard, type PostSummary } from "@/components/marketing/post-card";
import { EmptyState } from "@/components/ui/misc";
import { buttonVariants } from "@/components/ui/button";

const PER_PAGE = 12;

type SearchParams = Promise<{ category?: string | string[]; page?: string | string[] }>;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function parseParams(sp: Awaited<SearchParams>) {
  const raw = first(sp.category);
  const category = raw && raw in BLOG_CATEGORY_LABEL ? raw : null;
  const page = Math.max(1, Number.parseInt(first(sp.page) ?? "1", 10) || 1);
  return { category, invalidCategory: !!raw && !category, page };
}

function blogHref(category: string | null, page = 1) {
  const q = new URLSearchParams();
  if (category) q.set("category", category);
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `/blog?${s}` : "/blog";
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  const { category, invalidCategory, page } = parseParams(await searchParams);
  const label = category ? BLOG_CATEGORY_LABEL[category] : null;
  return pageMetadata({
    title: label ? `${label} Articles` : page > 1 ? `Laptop Buying Guides & Tips — Page ${page}` : "Laptop Buying Guides & Tips",
    description:
      "Practical guides to buying, comparing and caring for refurbished laptops in India — budgets, specs, battery health, business laptops and more.",
    // Filtered variants point canonical at the main index and stay out of the index.
    path: category || invalidCategory ? "/blog" : blogHref(null, page),
    noindex: !!category || invalidCategory,
  });
}

function toSummary(p: Awaited<ReturnType<typeof getAllPosts>>[number]): PostSummary {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    coverImage: p.coverImage,
    coverAlt: p.coverAlt,
    publishedAt: p.publishedAt,
    readingMinutes: p.readingMinutes,
  };
}

export default async function BlogIndexPage({ searchParams }: { searchParams: SearchParams }) {
  const { category, page } = parseParams(await searchParams);
  const raw = await getAllPosts();
  const all = raw.map(toSummary);
  const usedCategories = Object.keys(BLOG_CATEGORY_LABEL).filter((c) => all.some((p) => p.category === c));

  const filtered = category ? all.filter((p) => p.category === category) : all;
  // The featured hero only appears on the unfiltered first page.
  const featuredSlug = category ? null : (raw.find((p) => p.featured)?.slug ?? null);
  const featured = page === 1 ? (all.find((p) => p.slug === featuredSlug) ?? null) : null;
  // The featured post is excluded from the grid on every page so pagination stays stable.
  const rest = featuredSlug ? filtered.filter((p) => p.slug !== featuredSlug) : filtered;

  const totalPages = Math.max(1, Math.ceil(rest.length / PER_PAGE));
  if (page > totalPages) notFound();
  const posts = rest.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <PageHeader
        eyebrow="Guides & advice"
        title={category ? BLOG_CATEGORY_LABEL[category] : "The RenewByte blog"}
        description="Honest, practical advice on choosing a refurbished laptop, getting the right specs for your budget and keeping it running for years."
        crumbs={[{ name: "Blog", path: "/blog" }, ...(category ? [{ name: BLOG_CATEGORY_LABEL[category], path: blogHref(category) }] : [])]}
      />

      <div className="container-page py-10 sm:py-14">
        {usedCategories.length > 1 && (
          <nav aria-label="Blog categories" className="mb-8">
            <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {[null, ...usedCategories].map((c) => {
                const active = c === category;
                return (
                  <li key={c ?? "all"} className="shrink-0">
                    <Link
                      href={blogHref(c)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
                      )}
                    >
                      {c ? BLOG_CATEGORY_LABEL[c] : "All articles"}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {featured && (
          <section aria-label="Featured article" className="mb-12">
            <FeaturedPostCard post={featured} />
          </section>
        )}

        {posts.length === 0 && !featured ? (
          <EmptyState
            icon={<Newspaper />}
            title="No articles here yet"
            description="We're working on new guides. In the meantime, browse everything we've published."
          >
            <Link href="/blog" className={buttonVariants({ variant: "outline" })}>
              All articles
            </Link>
          </EmptyState>
        ) : (
          <section aria-label={category ? `${BLOG_CATEGORY_LABEL[category]} articles` : "Latest articles"}>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <li key={p.slug} className="flex">
                  <PostCard post={p} className="w-full" headingLevel="h2" />
                </li>
              ))}
            </ul>
          </section>
        )}

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
            {page > 1 ? (
              <Link href={blogHref(category, page - 1)} rel="prev" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <ChevronLeft aria-hidden /> Newer
              </Link>
            ) : null}
            <span className="num px-3 font-mono text-sm text-muted">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={blogHref(category, page + 1)} rel="next" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Older <ChevronRight aria-hidden />
              </Link>
            ) : null}
          </nav>
        )}
      </div>
    </>
  );
}
