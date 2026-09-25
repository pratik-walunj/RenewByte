import Link from "next/link";
import { BadgeCheck, CircleAlert, Clock, MessageCircle, Phone, ShieldCheck, Truck } from "lucide-react";
import type { ProductCardData, ProductDetailData } from "@/lib/types";
import type { ConditionGradesContent, SiteSettings } from "@/lib/cms";
import { formatPrice } from "@/lib/format";
import { digitsOnly } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/page-shell";
import { WhatsAppButton, WhatsAppProductContext } from "@/components/layout/whatsapp";
import { Stars } from "@/components/ui/misc";
import { GradeInfoDialog, GradeTag } from "@/components/product/grade";
import { Price } from "@/components/product/price";
import { StockStatus } from "@/components/product/stock-status";
import { ProductGallery } from "@/components/product/product-gallery";
import { BuyActions, StickyBuyBar, TrackProductView } from "@/components/product/buy-box";
import { Countdown } from "@/components/product/countdown";
import { ProductReviews } from "@/components/product/reviews";
import { ProductRail } from "@/components/product/product-rail";
import { BatteryInfo, Highlights, IncludedList, PolicyCards, SectionBlock, SpecTable } from "@/components/product/detail-sections";
import { FaqList } from "@/components/marketing/faq-list";

type Props = {
  product: ProductDetailData;
  related: ProductCardData[];
  reviews: {
    reviews: { id: string; authorName: string; rating: number; title: string | null; body: string; isVerifiedPurchase: boolean; createdAt: Date }[];
    distribution: { rating: number; count: number }[];
  };
  grades: ConditionGradesContent;
  faqs: { question: string; answer: string }[];
  site: SiteSettings;
  shipping: { free: boolean; minDays: number; maxDays: number };
};

const NAV = [
  ["highlights", "Highlights"],
  ["specifications", "Specifications"],
  ["condition", "Condition"],
  ["battery", "Battery"],
  ["included", "What's included"],
  ["policies", "Warranty & returns"],
  ["reviews", "Reviews"],
  ["faqs", "FAQs"],
] as const;

export function ProductDetail({ product: p, related, reviews, grades, faqs, site, shipping }: Props) {
  const grade = grades.grades.find((g) => g.grade === p.conditionGrade);
  const meta = {
    id: p.id,
    name: p.name,
    brand: p.brand.name,
    price: p.price,
    mrp: p.mrp,
    slug: p.slug,
    outOfStock: p.stock === "out",
  };
  const images = p.images.length ? p.images : p.image ? [p.image] : [];
  const deliveryText = `${shipping.free ? "Free delivery" : "Delivery"} in ${shipping.minDays}–${shipping.maxDays} business days`;

  return (
    <>
      <TrackProductView id={p.id} name={p.name} brand={p.brand.name} price={p.price} />
      <WhatsAppProductContext productName={p.name} />

      <div className="container-page pt-5 pb-4 sm:pt-6">
        <Breadcrumbs
          items={[
            { name: "Laptops", path: "/laptops" },
            { name: p.brand.name, path: `/brand/${p.brand.slug}` },
            { name: p.name, path: `/laptops/${p.slug}` },
          ]}
        />
      </div>

      <div className="container-page grid gap-8 pb-10 lg:grid-cols-[1.12fr_1fr] lg:gap-12">
        <div className="min-w-0 lg:sticky lg:top-32 lg:self-start">
          <ProductGallery images={images} name={p.name} />
        </div>

        <div className="min-w-0">
          {p.isDemo && (
            <p className="mb-4 flex items-start gap-2 rounded-lg border border-warning-bright/40 bg-warning-soft px-3 py-2 text-[13px] text-warning">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              Demo listing — sample data for development. Price, stock and battery figures are illustrative.
            </p>
          )}
          <Link href={`/brand/${p.brand.slug}`} className="eyebrow hover:text-foreground">
            {p.brand.name}
          </Link>
          <h1 className="mt-1.5 text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">{p.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
            {p.ratingCount > 0 ? (
              <a href="#reviews" className="inline-flex items-center gap-1.5 hover:text-foreground">
                <Stars rating={p.ratingAvg} />
                <span className="num">
                  {p.ratingAvg.toFixed(1)} ({p.ratingCount})
                </span>
              </a>
            ) : (
              <a href="#reviews" className="hover:text-foreground">
                No reviews yet
              </a>
            )}
            <span>
              SKU <span className="font-mono text-foreground/80">{p.sku}</span>
            </span>
            <StockStatus state={p.stock} available={p.available} />
          </div>

          {p.shortDescription && <p className="mt-4 text-[15px] leading-relaxed text-foreground/80">{p.shortDescription}</p>}

          <div className="mt-6 rounded-xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <GradeTag grade={p.conditionGrade} size="md" />
              <GradeInfoDialog grade={p.conditionGrade} />
            </div>
            {grade?.summary && <p className="mt-3 text-sm text-muted">{grade.summary}</p>}
            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
              <div>
                <dt className="eyebrow">Battery</dt>
                <dd className="num mt-1 text-sm font-semibold">{p.batteryHealth !== null ? `${p.batteryHealth}%` : "—"}</dd>
              </div>
              <div>
                <dt className="eyebrow">Warranty</dt>
                <dd className="mt-1 text-sm font-semibold">{p.warrantyMonths} months</dd>
              </div>
              <div>
                <dt className="eyebrow">Tested</dt>
                <dd className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-success">
                  <BadgeCheck className="size-4" aria-hidden /> Passed
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6">
            <Price price={p.price} mrp={p.mrp} size="lg" />
            <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>
            {p.isDeal && p.dealEndsAt && new Date(p.dealEndsAt) > new Date() && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-sale-soft px-2.5 py-1 text-[13px] font-medium text-sale">
                <Clock className="size-3.5" aria-hidden />
                <Countdown endsAt={p.dealEndsAt} compact />
              </p>
            )}
          </div>

          <div id="buy-actions" className="mt-6">
            <BuyActions product={meta} />
          </div>

          <ul className="mt-6 space-y-3 rounded-xl bg-subtle p-4 text-sm">
            <li className="flex items-start gap-3">
              <Truck className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
              <span>
                <span className="font-medium">{deliveryText}</span>
                <span className="block text-muted">Insured shipping with tracking across India.</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
              <span>
                <span className="font-medium">{p.warrantyMonths}-month warranty</span>
                <span className="block text-muted">
                  Hardware faults covered. <Link href="/warranty" className="text-accent hover:underline">Details</Link>
                </span>
              </span>
            </li>
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-muted">Questions about this laptop?</span>
            <WhatsAppButton
              location="product"
              product={p.name}
              message={`Hi, I am interested in the ${p.name} (SKU ${p.sku}).`}
              className="inline-flex items-center gap-1.5 font-medium text-[#128C4B] hover:underline"
            >
              <MessageCircle className="size-4" aria-hidden /> WhatsApp
            </WhatsAppButton>
            {site.phone && (
              <a href={`tel:+${digitsOnly(site.phone)}`} className="inline-flex items-center gap-1.5 font-medium hover:underline">
                <Phone className="size-4" aria-hidden /> Call
              </a>
            )}
          </div>
        </div>
      </div>

      <nav aria-label="Product sections" className="sticky top-16 z-20 border-y border-border bg-surface/95 backdrop-blur lg:top-[108px]">
        <ul className="container-page scrollbar-none flex gap-1 overflow-x-auto">
          {NAV.filter(([id]) => id !== "faqs" || faqs.length).map(([id, label]) => (
            <li key={id} className="shrink-0">
              <a href={`#${id}`} className="block px-3 py-3 text-[13px] font-medium text-muted transition-colors hover:text-foreground">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="container-page max-w-5xl">
        <SectionBlock id="highlights" title="Product highlights" className="border-t-0">
          <div className="grid gap-8 md:grid-cols-2">
            <Highlights items={p.highlights} />
            {p.description && (
              <div className="space-y-3 text-[15px] leading-relaxed text-foreground/80">
                {p.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}
          </div>
          {p.features.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {p.features.map((f) => (
                <li key={f} className="rounded-full border border-border bg-surface px-3 py-1 text-[13px]">
                  {f}
                </li>
              ))}
            </ul>
          )}
        </SectionBlock>

        <SectionBlock id="specifications" title="Specifications">
          <SpecTable p={p} />
        </SectionBlock>

        <SectionBlock id="condition" title="Condition details">
          {grade ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Visual condition", grade.cosmetic],
                ["Performance", grade.performance],
                ["Warranty", grade.warranty],
                ["Ideal for", grade.idealFor],
              ]
                .filter(([, v]) => v)
                .map(([label, text]) => (
                  <div key={label} className="rounded-xl border border-border bg-surface p-5">
                    <p className="eyebrow">{label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/85">{text}</p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted">This laptop is graded {p.conditionGrade.replace("_PLUS", "+")}.</p>
          )}
          <p className="mt-4 text-sm text-muted">
            Grades describe cosmetic condition only — every grade passes the same hardware tests.{" "}
            <Link href="/condition-grades" className="font-medium text-accent hover:underline">
              Compare all grades
            </Link>
          </p>
        </SectionBlock>

        <SectionBlock id="battery" title="Battery information">
          <BatteryInfo health={p.batteryHealth} backup={p.batteryBackup} />
        </SectionBlock>

        <SectionBlock id="included" title="What's included">
          <IncludedList items={p.whatsIncluded} />
        </SectionBlock>

        <SectionBlock id="policies" title="Warranty, shipping & returns">
          <PolicyCards
            warrantyMonths={p.warrantyMonths}
            shippingText={`${deliveryText}. Dispatched with tracking; you'll get the tracking number by email.`}
          />
        </SectionBlock>

        <SectionBlock id="reviews" title="Customer reviews">
          <ProductReviews
            productId={p.id}
            slug={p.slug}
            average={p.ratingAvg}
            count={p.ratingCount}
            distribution={reviews.distribution}
            reviews={reviews.reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
          />
        </SectionBlock>

        {faqs.length > 0 && (
          <SectionBlock id="faqs" title="Frequently asked questions">
            <FaqList items={faqs} />
          </SectionBlock>
        )}
      </div>

      {related.length > 0 && (
        <section className="border-t border-border bg-surface" aria-labelledby="related-h">
          <div className="container-page py-12">
            <h2 id="related-h" className="text-xl font-semibold tracking-tight sm:text-2xl">
              You may also like
            </h2>
            <p className="mt-1 mb-2 text-sm text-muted">Similar laptops around {formatPrice(p.price)}</p>
            <ProductRail products={related} label="Related laptops" />
          </div>
        </section>
      )}

      <StickyBuyBar product={meta} anchorId="buy-actions" />
    </>
  );
}
