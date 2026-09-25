import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { getConditionGrades, getFaqs, getLandingPage, getSiteSettings } from "@/lib/cms";
import { countActiveFilters, parseFilters } from "@/lib/filters";
import { GRADE_LABEL } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import {
  getBrand,
  getCategory,
  getFacets,
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
  listProducts,
} from "@/server/catalog";
import { getStoreSettings } from "@/server/settings";
import { quoteShipping } from "@/server/shipping";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductDetailSkeleton } from "@/components/product/skeletons";
import type { ProductDetailData } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-shell";
import { CatalogView } from "@/components/filters/catalog-view";
import { LandingFooterContent, LandingHighlights } from "@/components/filters/landing-content";
import { JsonLd } from "@/components/seo/json-ld";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * /laptops/[slug] serves three things, in priority order:
 *  1. a product            (/laptops/dell-latitude-5420-core-i5-16gb-512gb)
 *  2. a CMS listing page   (/laptops/under-30000)
 *  3. brand/category aliases, permanently redirected to their canonical page (/laptops/dell → /brand/dell)
 */
async function resolve(slug: string) {
  const product = await getProductBySlug(slug);
  if (product) return { kind: "product" as const, product };
  const landing = await getLandingPage(slug);
  if (landing && landing.kind === "listing") return { kind: "landing" as const, landing };
  return { kind: "none" as const };
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (r.kind === "product") {
    const p = r.product;
    return pageMetadata({
      title: p.seoTitle || `Refurbished ${p.name} — ${p.processorFamily}, ${p.ramGb}GB RAM`,
      description:
        p.seoDescription ||
        `${p.shortDescription ?? p.name} ${GRADE_LABEL[p.conditionGrade]}, ${p.warrantyMonths}-month warranty.`.trim(),
      path: `/laptops/${p.slug}`,
      image: p.images[0]?.url,
      imageAlt: p.images[0]?.alt,
    });
  }
  if (r.kind === "landing") {
    const filters = parseFilters(await searchParams);
    return pageMetadata({
      title: r.landing.seo.title || r.landing.heading,
      description: r.landing.seo.description || r.landing.intro,
      path: `/laptops/${slug}`,
      noindex: countActiveFilters(filters) > 0 || filters.page > 1 || filters.sort !== "featured",
    });
  }
  return {};
}

export default async function LaptopSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const r = await resolve(slug);

  if (r.kind === "landing") {
    const { landing } = r;
    const min = landing.filters.minPrice ?? undefined;
    const max = landing.filters.maxPrice ?? undefined;
    const base = parseFilters(await searchParams);
    const filters = {
      ...base,
      min,
      max,
      brand: landing.filters.brand ? [landing.filters.brand] : base.brand,
      category: landing.filters.category ? [landing.filters.category] : base.category,
    };
    const [result, facets] = await Promise.all([
      listProducts(filters),
      getFacets({ min, max, brand: landing.filters.brand || undefined, category: landing.filters.category || undefined }),
    ]);
    return (
      <>
        <PageHeader
          crumbs={[
            { name: "Laptops", path: "/laptops" },
            { name: landing.heading, path: `/laptops/${slug}` },
          ]}
          title={landing.heading}
          description={landing.intro}
        >
          <LandingHighlights items={landing.highlights} />
        </PageHeader>
        <CatalogView
          basePath={`/laptops/${slug}`}
          filters={filters}
          facets={facets}
          result={result}
          locked={{ price: true, brand: !!landing.filters.brand, category: !!landing.filters.category }}
          emptyAction={{ label: "Browse all laptops", href: "/laptops" }}
        />
        {filters.page === 1 && <LandingFooterContent landing={landing} title={landing.heading} />}
      </>
    );
  }

  if (r.kind === "none") {
    const brand = await getBrand(slug);
    if (brand) permanentRedirect(`/brand/${brand.slug}`);
    const category = (await getCategory(slug)) ?? (await getCategory(`${slug}-laptops`));
    if (category) permanentRedirect(`/category/${category.slug}`);
    notFound();
  }

  // The product exists: stream the heavier sections behind a skeleton. (404s and
  // redirects above are decided before streaming starts, so they get real status codes.)
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductBody product={r.product} />
    </Suspense>
  );
}

async function ProductBody({ product: p }: { product: ProductDetailData }) {
  const [related, reviews, grades, faqs, site, settings] = await Promise.all([
    getRelatedProducts(p.id, p.category.slug, p.brand.slug, p.price),
    getProductReviews(p.id),
    getConditionGrades(),
    getFaqs(),
    getSiteSettings(),
    getStoreSettings(),
  ]);
  const [standard] = await quoteShipping({ subtotal: p.price, settings });

  const url = absoluteUrl(`/laptops/${p.slug}`);
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    mpn: p.sku,
    description: p.shortDescription || p.description || p.name,
    image: p.images.map((i) => absoluteUrl(i.url)),
    brand: { "@type": "Brand", name: p.brand.name },
    category: p.category.name,
    itemCondition: "https://schema.org/RefurbishedCondition",
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: (p.price / 100).toFixed(2),
      itemCondition: "https://schema.org/RefurbishedCondition",
      availability:
        p.stock === "out"
          ? "https://schema.org/OutOfStock"
          : p.stock === "low"
            ? "https://schema.org/LimitedAvailability"
            : "https://schema.org/InStock",
      ...(p.dealEndsAt ? { priceValidUntil: p.dealEndsAt.slice(0, 10) } : {}),
      seller: { "@type": "Organization", name: site.businessName },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: (standard.fee / 100).toFixed(2), currency: "INR" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: standard.minDays, maxValue: standard.maxDays, unitCode: "DAY" },
        },
      },
    },
    ...(p.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: p.ratingAvg.toFixed(1),
            reviewCount: p.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.reviews.slice(0, 5).map((rv) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: rv.rating, bestRating: 5 },
            author: { "@type": "Person", name: rv.authorName },
            datePublished: rv.createdAt.toISOString().slice(0, 10),
            reviewBody: rv.body,
          })),
        }
      : {}),
  };

  return (
    <>
      <ProductDetail
        product={p}
        related={related}
        reviews={reviews}
        grades={grades}
        faqs={faqs.filter((f) => f.showOnProduct).map((f) => ({ question: f.question, answer: f.answer }))}
        site={site}
        shipping={{ free: standard.fee === 0, minDays: standard.minDays, maxDays: standard.maxDays }}
      />
      <JsonLd data={productLd} />
    </>
  );
}
