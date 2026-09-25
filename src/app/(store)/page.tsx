import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Timer } from "lucide-react";
import {
  BLOG_CATEGORY_LABEL,
  getAllPosts,
  getBanners,
  getFaqs,
  getHomepage,
  getRefurbishProcess,
  getTestimonials,
} from "@/lib/cms";
import { formatPrice } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { faqJsonLd } from "@/lib/seo";
import {
  getBestSellers,
  getBrandsWithStats,
  getCategoriesWithStats,
  getDeals,
  getFacets,
  getFeaturedProducts,
  getRecentReviews,
} from "@/server/catalog";
import { Hero } from "@/components/home/hero";
import {
  BlogPreview,
  BrandGrid,
  CategoryGrid,
  ProcessPreview,
  PromoBanner,
  ReviewsSection,
  TrustStrip,
  WhyRefurbished,
  type ReviewItem,
} from "@/components/home/sections";
import { ProductGrid } from "@/components/product/product-card";
import { ProductRail } from "@/components/product/product-rail";
import { Countdown } from "@/components/product/countdown";
import { SectionHeading } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { FaqList } from "@/components/marketing/faq-list";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { JsonLd } from "@/components/seo/json-ld";

export async function generateMetadata() {
  const home = await getHomepage();
  return pageMetadata({
    title: "Certified Refurbished Laptops in India — Tested & Warranty Backed",
    description:
      home?.hero.subheadline ||
      "Buy professionally tested refurbished laptops from Dell, HP, Lenovo, Apple and more with transparent condition grades and warranty.",
    path: "/",
    absoluteTitle: false,
  });
}

/** Earliest deal expiry still in the future (for the countdown). */
function nextDealEnd(dates: (string | null)[]) {
  const now = new Date().toISOString();
  return dates.filter((d): d is string => !!d && d > now).sort()[0];
}

export default async function HomePage() {
  await connection();
  const [home, brands, categories, bestSellers, deals, featured, facets, process, testimonials, reviews, posts, faqs, midBanners, bottomBanners] =
    await Promise.all([
      getHomepage(),
      getBrandsWithStats(),
      getCategoriesWithStats(),
      getBestSellers(8),
      getDeals(10),
      getFeaturedProducts(8),
      getFacets(),
      getRefurbishProcess(),
      getTestimonials(),
      getRecentReviews(6),
      getAllPosts(),
      getFaqs(),
      getBanners("home-mid"),
      getBanners("home-bottom"),
    ]);

  const s = home?.sections;
  const homeFaqs = faqs.filter((f) => f.showOnHome).map((f) => ({ question: f.question, answer: f.answer }));
  const dealEnds = nextDealEnd(deals.map((d) => d.dealEndsAt));

  const reviewItems: ReviewItem[] = [
    ...reviews.map((r) => ({
      key: r.id,
      name: r.authorName,
      rating: r.rating,
      quote: r.body,
      product: r.product.name,
      date: r.createdAt,
      verified: r.isVerifiedPurchase,
    })),
    ...testimonials.map((t) => ({
      key: `t-${t.slug}`,
      name: t.name,
      location: t.location,
      rating: t.rating ?? 5,
      quote: t.quote,
      product: t.product,
      date: t.date,
      sample: t.isSample,
    })),
  ];

  return (
    <>
      {home && (
        <Hero
          hero={home.hero}
          stats={{
            products: facets.total,
            fromPrice: facets.total ? formatPrice(facets.priceRange.min * 100) : null,
          }}
        />
      )}
      <TrustStrip items={home?.trustFeatures ?? []} />

      <BrandGrid
        brands={brands}
        title={s?.brands.title || "Shop by brand"}
        subtitle={s?.brands.subtitle}
      />

      <CategoryGrid
        categories={categories}
        title={s?.categories.title || "Shop by category"}
        subtitle={s?.categories.subtitle}
      />

      {bestSellers.length > 0 && (
        <section className="container-page py-14 sm:py-16" aria-labelledby="bestsellers-heading">
          <SectionHeading
            id="bestsellers-heading"
            title={s?.bestSellers.title || "Best sellers"}
            subtitle={s?.bestSellers.subtitle}
            action={{ label: "View all", href: "/laptops?sort=best-selling" }}
          />
          <ProductGrid products={bestSellers} />
        </section>
      )}

      {midBanners.map((b) => (
        <PromoBanner key={b.slug} banner={b} />
      ))}

      {deals.length > 0 && (
        <section className="my-8 bg-[#0b1120] text-white" aria-labelledby="deals-heading">
          <div className="container-page py-14 sm:py-16">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <p className="eyebrow inline-flex items-center gap-1.5 text-red-300">
                  <Timer className="size-3.5" aria-hidden /> Limited stock
                </p>
                <h2 id="deals-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">
                  {s?.deals.title || "Deals"}
                </h2>
                {s?.deals.subtitle && <p className="mt-2 text-[15px] text-slate-400">{s.deals.subtitle}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {dealEnds && <Countdown endsAt={dealEnds} />}
                <Button asChild variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10">
                  <Link href="/deals">
                    {s?.deals.ctaLabel || "Shop all deals"} <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
            <ProductRail products={deals} label="Deals" tone="dark" />
          </div>
        </section>
      )}

      {home && (
        <WhyRefurbished
          title={home.whyRefurbished.title}
          subtitle={home.whyRefurbished.subtitle}
          points={home.whyRefurbished.points}
        />
      )}

      {process && (
        <ProcessPreview
          title={s?.process.title || process.title}
          subtitle={s?.process.subtitle || undefined}
          steps={process.steps}
        />
      )}

      {featured.length > 0 && (
        <section className="container-page pb-14 sm:pb-16" aria-labelledby="featured-heading">
          <SectionHeading
            id="featured-heading"
            title={s?.featured.title || "Featured laptops"}
            subtitle={s?.featured.subtitle}
            action={{ label: "Browse all", href: "/laptops" }}
          />
          <ProductGrid products={featured} />
        </section>
      )}

      <ReviewsSection title={s?.reviews.title || "What customers say"} subtitle={s?.reviews.subtitle} reviews={reviewItems} />

      <BlogPreview
        title={s?.blog.title || "Buying guides"}
        subtitle={s?.blog.subtitle}
        categoryLabel={BLOG_CATEGORY_LABEL}
        posts={[...posts.filter((p) => p.featured), ...posts.filter((p) => !p.featured)].slice(0, 3).map((p) => ({
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          coverImage: p.coverImage,
          coverAlt: p.coverAlt,
          category: p.category,
          publishedAt: p.publishedAt,
          readingMinutes: p.readingMinutes,
        }))}
      />

      {homeFaqs.length > 0 && (
        <section className="border-t border-border bg-surface" aria-labelledby="faq-heading">
          <div className="container-page grid gap-8 py-14 sm:py-16 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
            <div>
              <SectionHeading id="faq-heading" title={s?.faq.title || "FAQs"} subtitle={s?.faq.subtitle} className="mb-4" />
              <Link href="/faq" className="text-sm font-medium text-accent hover:underline">
                View all FAQs →
              </Link>
            </div>
            <FaqList items={homeFaqs} />
          </div>
          <JsonLd data={faqJsonLd(homeFaqs)} />
        </section>
      )}

      {bottomBanners.map((b) => (
        <PromoBanner key={b.slug} banner={b} />
      ))}

      {home && (
        <section className="container-page pt-14 sm:pt-16" aria-label="Newsletter">
          <NewsletterForm
            title={home.newsletter.title}
            subtitle={home.newsletter.subtitle}
            disclaimer={home.newsletter.disclaimer}
          />
        </section>
      )}
    </>
  );
}
