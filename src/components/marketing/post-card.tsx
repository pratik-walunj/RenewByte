import Image from "next/image";
import Link from "next/link";
import { BLOG_CATEGORY_LABEL } from "@/lib/cms";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverImage: string | null;
  coverAlt: string;
  publishedAt: string | null;
  readingMinutes: number | null;
};

export function PostMeta({ post, className }: { post: Pick<PostSummary, "publishedAt" | "readingMinutes">; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 font-mono text-xs text-muted", className)}>
      {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
      {post.publishedAt && post.readingMinutes ? <span aria-hidden>·</span> : null}
      {post.readingMinutes ? <span>{post.readingMinutes} min read</span> : null}
    </p>
  );
}

function Cover({ post, sizes, priority }: { post: PostSummary; sizes: string; priority?: boolean }) {
  return post.coverImage ? (
    <Image
      src={post.coverImage}
      alt={post.coverAlt || ""}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
    />
  ) : (
    <div aria-hidden className="absolute inset-0 bg-stage" />
  );
}

/** Blog post card for grids (blog index, homepage "Buying guides", related posts). */
export function PostCard({ post, className, headingLevel = "h3" }: { post: PostSummary; className?: string; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-shadow hover:shadow-lift focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2", className)}>
      <div className="relative aspect-[16/10] overflow-hidden bg-stage">
        <Cover post={post} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow">{BLOG_CATEGORY_LABEL[post.category] ?? post.category}</p>
        <H className="mt-2 text-[17px] leading-snug font-semibold tracking-tight text-balance">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {post.title}
          </Link>
        </H>
        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted">{post.excerpt}</p>
        <PostMeta post={post} className="mt-auto pt-4" />
      </div>
    </article>
  );
}

/** Large horizontal card for the featured post at the top of /blog. */
export function FeaturedPostCard({ post }: { post: PostSummary }) {
  return (
    <article className="group relative grid overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow hover:shadow-lift focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-stage lg:aspect-auto lg:min-h-[340px]">
        <Cover post={post} sizes="(min-width: 1024px) 720px, 100vw" priority />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <p className="eyebrow">Featured · {BLOG_CATEGORY_LABEL[post.category] ?? post.category}</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted text-pretty">{post.excerpt}</p>
        <PostMeta post={post} className="mt-5" />
        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
          Read article <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </article>
  );
}
