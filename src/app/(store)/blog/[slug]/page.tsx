import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_CATEGORY_LABEL, getAllPosts, getPost, getSiteSettings } from "@/lib/cms";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { MarkdocContent, markdocHeadings } from "@/components/cms/markdoc";
import { TableOfContents } from "@/components/cms/table-of-contents";
import { PostCard } from "@/components/marketing/post-card";
import { ShopCta } from "@/components/marketing/shop-cta";
import { SectionHeading } from "@/components/ui/misc";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return pageMetadata({ title: "Article not found", path: `/blog/${slug}`, noindex: true });
  return pageMetadata({
    title: post.seo.title || post.title,
    description: post.seo.description || post.excerpt,
    path: `/blog/${slug}`,
    type: "article",
    image: post.coverImage,
    imageAlt: post.coverAlt || post.title,
    publishedTime: post.publishedAt ?? undefined,
  });
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [post, all, site] = await Promise.all([getPost(slug), getAllPosts(), getSiteSettings()]);
  if (!post) notFound();

  const categoryLabel = BLOG_CATEGORY_LABEL[post.category] ?? post.category;
  const headings = markdocHeadings(post.content);
  const others = all.filter((p) => p.slug !== slug);
  const related = [...others.filter((p) => p.category === post.category), ...others.filter((p) => p.category !== post.category)].slice(0, 3);
  const updated = post.updatedAt && post.updatedAt !== post.publishedAt ? post.updatedAt : null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seo.description || post.excerpt,
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/blog/${slug}`) },
    ...(post.coverImage ? { image: [absoluteUrl(post.coverImage)] } : {}),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: { "@type": "Organization", name: post.author || `${site.businessName} Team`, url: absoluteUrl("/about") },
    publisher: {
      "@type": "Organization",
      name: site.businessName,
      logo: { "@type": "ImageObject", url: absoluteUrl(site.logo || "/icon.svg") },
    },
    articleSection: categoryLabel,
  };

  return (
    <>
      <article>
        <header className="border-b border-border bg-surface">
          <div className="container-page pt-8 pb-10 sm:pt-10 sm:pb-12">
            <Breadcrumbs
              items={[
                { name: "Blog", path: "/blog" },
                { name: post.title, path: `/blog/${slug}` },
              ]}
              className="mb-6"
            />
            <div className="max-w-3xl">
              <Link href={`/blog?category=${post.category}`} className="eyebrow hover:text-foreground">
                {categoryLabel}
              </Link>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                {post.title}
              </h1>
              <p className="mt-4 text-[17px] leading-relaxed text-muted text-pretty">{post.excerpt}</p>
              <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-muted">
                <div className="flex gap-1.5">
                  <dt className="text-faint">By</dt>
                  <dd className="text-foreground">{post.author || `${site.businessName} Team`}</dd>
                </div>
                {post.publishedAt && (
                  <div className="flex gap-1.5">
                    <dt className="text-faint">Published</dt>
                    <dd>
                      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                    </dd>
                  </div>
                )}
                {updated && (
                  <div className="flex gap-1.5">
                    <dt className="text-faint">Updated</dt>
                    <dd>
                      <time dateTime={updated}>{formatDate(updated)}</time>
                    </dd>
                  </div>
                )}
                {post.readingMinutes ? (
                  <div className="flex gap-1.5">
                    <dt className="sr-only">Reading time</dt>
                    <dd>{post.readingMinutes} min read</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </header>

        <div className="container-page py-10 sm:py-12">
          {post.coverImage && (
            <figure className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-stage sm:mb-14 lg:aspect-[21/9]">
              <Image
                src={post.coverImage}
                alt={post.coverAlt || ""}
                fill
                priority
                sizes="(min-width: 1320px) 1256px, 100vw"
                className="object-cover"
              />
            </figure>
          )}

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
            <div className="min-w-0">
              <MarkdocContent node={post.content} />
              <div className="mt-12 max-w-[72ch] border-t border-border pt-6 text-[14px] text-muted">
                Found this useful? Browse more{" "}
                <Link href={`/blog?category=${post.category}`} className="font-medium text-accent hover:underline">
                  {categoryLabel.toLowerCase()} articles
                </Link>{" "}
                or see how we{" "}
                <Link href="/how-we-refurbish" className="font-medium text-accent hover:underline">
                  test and refurbish every laptop
                </Link>
                .
              </div>
              <ShopCta className="mt-10 max-w-[72ch] lg:hidden" />
            </div>
            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-8">
                <TableOfContents headings={headings} />
                <ShopCta compact />
              </div>
            </aside>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="border-t border-border bg-surface">
          <div className="container-page py-14 sm:py-16">
            <SectionHeading id="related-title" title="Related articles" action={{ label: "All articles", href: "/blog" }} />
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.slug} className="flex">
                  <PostCard
                    className="w-full"
                    post={{
                      slug: p.slug,
                      title: p.title,
                      excerpt: p.excerpt,
                      category: p.category,
                      coverImage: p.coverImage,
                      coverAlt: p.coverAlt,
                      publishedAt: p.publishedAt,
                      readingMinutes: p.readingMinutes,
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <JsonLd data={articleJsonLd} />
    </>
  );
}
