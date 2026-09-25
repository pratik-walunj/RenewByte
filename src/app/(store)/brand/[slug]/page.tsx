import { notFound } from "next/navigation";
import { getLandingContentFor } from "@/lib/cms";
import { countActiveFilters, parseFilters } from "@/lib/filters";
import { pageMetadata } from "@/lib/seo";
import { getBrand, getFacets, listProducts } from "@/server/catalog";
import { PageHeader } from "@/components/layout/page-shell";
import { CatalogView } from "@/components/filters/catalog-view";
import { LandingFooterContent, LandingHighlights } from "@/components/filters/landing-content";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const [brand, landing, sp] = await Promise.all([getBrand(slug), getLandingContentFor("brand", slug), searchParams]);
  if (!brand) return {};
  const filters = parseFilters(sp);
  return pageMetadata({
    title: landing?.seo.title || brand.seoTitle || `Refurbished ${brand.name} Laptops`,
    description:
      landing?.seo.description ||
      brand.seoDescription ||
      `Shop certified refurbished ${brand.name} laptops with transparent condition grades, measured battery health and warranty.`,
    path: `/brand/${slug}`,
    noindex: countActiveFilters(filters) > 0 || filters.page > 1 || filters.sort !== "featured",
  });
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) notFound();

  const filters = { ...parseFilters(await searchParams), brand: [slug] };
  const [result, facets, landing] = await Promise.all([
    listProducts(filters),
    getFacets({ brand: slug }),
    getLandingContentFor("brand", slug),
  ]);

  const title = landing?.heading || `Refurbished ${brand.name} laptops`;
  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Laptops", path: "/laptops" },
          { name: brand.name, path: `/brand/${slug}` },
        ]}
        eyebrow={`${brand.productCount} ${brand.productCount === 1 ? "laptop" : "laptops"} in stock`}
        title={title}
        description={landing?.intro || brand.description}
      >
        <LandingHighlights items={landing?.highlights ?? []} />
      </PageHeader>
      <CatalogView
        basePath={`/brand/${slug}`}
        filters={filters}
        facets={facets}
        result={result}
        locked={{ brand: true }}
        emptyAction={{ label: "Browse all laptops", href: "/laptops" }}
      />
      {filters.page === 1 && <LandingFooterContent landing={landing} title={title} />}
    </>
  );
}
