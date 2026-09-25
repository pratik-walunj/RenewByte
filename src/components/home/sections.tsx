import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Quote } from "lucide-react";
import { CmsIcon } from "@/components/cms/icon";
import { SectionHeading, Stars } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";
import type { BrandWithStats, CategoryWithStats } from "@/server/catalog";

type IconItem = { icon: string; title: string; description: string };

export function TrustStrip({ items }: { items: readonly IconItem[] }) {
  if (!items.length) return null;
  return (
    <section aria-label="Why shop with us" className="border-b border-border bg-surface">
      <ul className="container-page grid grid-cols-2 gap-x-4 gap-y-5 py-6 sm:grid-cols-3 lg:grid-cols-5 lg:py-7">
        {items.map((f, i) => (
          <li key={f.title} className={`flex items-start gap-3 ${i === items.length - 1 && items.length % 2 === 1 ? "col-span-2 sm:col-span-1" : ""}`}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-foreground">
              <CmsIcon name={f.icon} className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{f.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BrandGrid({ brands, title, subtitle }: { brands: BrandWithStats[]; title: string; subtitle?: string }) {
  if (!brands.length) return null;
  return (
    <section className="container-page py-14 sm:py-16" aria-labelledby="brands-heading">
      <SectionHeading id="brands-heading" title={title} subtitle={subtitle} action={{ label: "All laptops", href: "/laptops" }} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {brands.map((b) => (
          <li key={b.slug}>
            <Link
              href={`/brand/${b.slug}`}
              className="group relative flex h-full min-h-28 flex-col justify-between rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lift sm:min-h-32 sm:p-5"
            >
              <span className="flex items-start justify-between gap-2">
                {b.logoUrl ? (
                  <Image src={b.logoUrl} alt={b.name} width={96} height={32} className="h-7 w-auto object-contain" />
                ) : (
                  <span className="text-xl font-semibold tracking-tight sm:text-2xl">{b.name}</span>
                )}
                <ArrowUpRight className="size-4 text-faint transition-colors group-hover:text-foreground" aria-hidden />
              </span>
              <span className="mt-4 text-[12.5px] text-muted">
                {b.productCount > 0 ? (
                  <>
                    <span className="num">{b.productCount}</span> {b.productCount === 1 ? "laptop" : "laptops"}
                    {b.fromPrice !== null && (
                      <>
                        {" "}
                        · from <span className="num font-medium text-foreground">{formatPrice(b.fromPrice)}</span>
                      </>
                    )}
                  </>
                ) : (
                  "New stock soon"
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const CATEGORY_ART: Record<string, string> = {
  "business-laptops": "/images/products/graphite-angle.webp",
  "student-laptops": "/images/products/silver-front.webp",
  "gaming-laptops": "/images/products/gaming-angle.webp",
  macbooks: "/images/products/spacegray-angle.webp",
  "budget-laptops": "/images/products/black-front.webp",
  "premium-laptops": "/images/products/silver-angle.webp",
  "2-in-1-laptops": "/images/products/midnight-angle.webp",
  ultrabooks: "/images/products/silver-side.webp",
};

export function CategoryGrid({
  categories,
  title,
  subtitle,
}: {
  categories: CategoryWithStats[];
  title: string;
  subtitle?: string;
}) {
  if (!categories.length) return null;
  return (
    <section className="border-y border-border bg-surface" aria-labelledby="categories-heading">
      <div className="container-page py-14 sm:py-16">
        <SectionHeading id="categories-heading" title={title} subtitle={subtitle} />
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/category/${c.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lift"
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-stage">
                  <Image
                    src={c.imageUrl || CATEGORY_ART[c.slug] || "/images/products/silver-angle.webp"}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 300px, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </span>
                <span className="flex flex-1 flex-col p-3.5 sm:p-4">
                  <span className="text-[15px] font-semibold tracking-tight">{c.name}</span>
                  {c.description && (
                    <span className="mt-1 line-clamp-2 hidden text-[13px] leading-snug text-muted sm:block">{c.description}</span>
                  )}
                  <span className="mt-auto pt-2 text-[12.5px] text-muted">
                    {c.fromPrice !== null ? (
                      <>
                        From <span className="num font-medium text-foreground">{formatPrice(c.fromPrice)}</span>
                      </>
                    ) : (
                      "Coming soon"
                    )}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function WhyRefurbished({
  title,
  subtitle,
  points,
}: {
  title: string;
  subtitle?: string;
  points: readonly IconItem[];
}) {
  if (!points.length) return null;
  return (
    <section className="bg-primary text-white" aria-labelledby="why-heading">
      <div className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div>
          <p className="eyebrow text-slate-400">The smarter choice</p>
          <h2 id="why-heading" className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h2>
          {subtitle && <p className="mt-4 text-[15px] leading-relaxed text-slate-300">{subtitle}</p>}
        </div>
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
          {points.map((p) => (
            <li key={p.title} className="bg-primary p-6">
              <CmsIcon name={p.icon} className="size-6 text-blue-400" />
              <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{p.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ProcessPreview({
  title,
  subtitle,
  steps,
}: {
  title: string;
  subtitle?: string;
  steps: readonly IconItem[];
}) {
  if (!steps.length) return null;
  return (
    <section className="container-page py-14 sm:py-16" aria-labelledby="process-heading">
      <SectionHeading
        id="process-heading"
        title={title}
        subtitle={subtitle}
        action={{ label: "See the full process", href: "/how-we-refurbish" }}
      />
      <ol className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-9 lg:gap-2">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="relative w-[70%] shrink-0 snap-start rounded-xl border border-border bg-surface p-4 sm:w-auto lg:p-3.5"
          >
            <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
            <CmsIcon name={s.icon} className="mt-3 size-5 text-accent" />
            <h3 className="mt-3 text-sm leading-snug font-semibold">{s.title}</h3>
            <p className="mt-1 text-[12.5px] leading-snug text-muted lg:hidden">{s.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export type ReviewItem = {
  key: string;
  name: string;
  location?: string | null;
  rating: number;
  quote: string;
  product?: string | null;
  date?: string | null;
  verified?: boolean;
  sample?: boolean;
};

export function ReviewsSection({ title, subtitle, reviews }: { title: string; subtitle?: string; reviews: ReviewItem[] }) {
  if (!reviews.length) return null;
  return (
    <section className="border-y border-border bg-surface" aria-labelledby="reviews-heading">
      <div className="container-page py-14 sm:py-16">
        <SectionHeading id="reviews-heading" title={title} subtitle={subtitle} />
        <ul className="grid gap-4 md:grid-cols-3">
          {reviews.slice(0, 6).map((r) => (
            <li key={r.key} className="flex flex-col rounded-xl border border-border bg-background p-5">
              <div className="flex items-center justify-between gap-2">
                <Stars rating={r.rating} />
                {r.sample ? (
                  <Badge tone="warning">Sample</Badge>
                ) : r.verified ? (
                  <Badge tone="success">
                    <BadgeCheck aria-hidden /> Verified purchase
                  </Badge>
                ) : null}
              </div>
              <Quote className="mt-4 size-5 text-faint" aria-hidden />
              <blockquote className="mt-2 flex-1 text-[15px] leading-relaxed text-foreground/85">{r.quote}</blockquote>
              <footer className="mt-5 border-t border-border pt-4 text-sm">
                <p className="font-medium">{r.name}</p>
                <p className="text-[12.5px] text-muted">
                  {[r.location, r.product, r.date ? formatDate(r.date) : null].filter(Boolean).join(" · ")}
                </p>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

type PostCard = { slug: string; title: string; excerpt: string; coverImage: string | null; coverAlt: string; category: string; publishedAt: string | null; readingMinutes: number | null };

export function BlogPreview({
  title,
  subtitle,
  posts,
  categoryLabel,
}: {
  title: string;
  subtitle?: string;
  posts: PostCard[];
  categoryLabel: Record<string, string>;
}) {
  if (!posts.length) return null;
  return (
    <section className="container-page py-14 sm:py-16" aria-labelledby="blog-heading">
      <SectionHeading id="blog-heading" title={title} subtitle={subtitle} action={{ label: "All guides", href: "/blog" }} />
      <ul className="grid gap-6 md:grid-cols-3">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="group block">
              <span className="relative block aspect-[1200/630] overflow-hidden rounded-xl border border-border bg-stage">
                {p.coverImage && (
                  <Image
                    src={p.coverImage}
                    alt={p.coverAlt || ""}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </span>
              <span className="mt-4 flex items-center gap-2 text-[12.5px] text-muted">
                <span className="font-medium text-accent">{categoryLabel[p.category] ?? p.category}</span>
                {p.readingMinutes ? <span>· {p.readingMinutes} min read</span> : null}
              </span>
              <span className="mt-1.5 block text-lg leading-snug font-semibold tracking-tight group-hover:text-accent">
                {p.title}
              </span>
              <span className="mt-1.5 line-clamp-2 block text-sm text-muted">{p.excerpt}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

type Banner = {
  slug: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  cta: { label: string; href: string };
  image: string | null;
  imageAlt: string;
  tone: string;
};

export function PromoBanner({ banner }: { banner: Banner }) {
  const tone =
    banner.tone === "light"
      ? "bg-surface border border-border text-foreground"
      : banner.tone === "accent"
        ? "bg-accent text-white"
        : "bg-primary text-white";
  const muted = banner.tone === "light" ? "text-muted" : "text-white/75";
  return (
    <section className="container-page py-6">
      <div className={`relative grid items-center gap-6 overflow-hidden rounded-2xl p-7 sm:p-10 md:grid-cols-[1.4fr_1fr] ${tone}`}>
        <div className="relative">
          {banner.eyebrow && <p className={`eyebrow ${muted}`}>{banner.eyebrow}</p>}
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{banner.title}</h2>
          {banner.subtitle && <p className={`mt-3 max-w-lg text-[15px] leading-relaxed ${muted}`}>{banner.subtitle}</p>}
          {banner.cta.href && (
            <Link
              href={banner.cta.href}
              className={`mt-6 inline-flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-medium transition-colors ${
                banner.tone === "light" ? "bg-primary text-white hover:bg-primary-hover" : "bg-white text-foreground hover:bg-slate-100"
              }`}
            >
              {banner.cta.label} <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
        {banner.image ? (
          <div className="relative aspect-[4/3] w-full">
            <Image src={banner.image} alt={banner.imageAlt || ""} fill sizes="400px" className="object-contain" />
          </div>
        ) : (
          <div aria-hidden className="relative hidden aspect-[4/3] w-full md:block">
            <Image src="/images/products/graphite-angle.webp" alt="" fill sizes="400px" className="rounded-xl object-cover opacity-95" />
          </div>
        )}
      </div>
    </section>
  );
}
