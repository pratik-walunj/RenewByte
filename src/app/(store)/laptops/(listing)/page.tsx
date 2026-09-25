import { getBanners, getLandingContentFor } from "@/lib/cms";
import { countActiveFilters, parseFilters } from "@/lib/filters";
import { pageMetadata } from "@/lib/seo";
import { getFacets, listProducts } from "@/server/catalog";
import { PageHeader } from "@/components/layout/page-shell";
import { CatalogView } from "@/components/filters/catalog-view";
import { LandingFooterContent, LandingHighlights } from "@/components/filters/landing-content";
import { PromoBanner } from "@/components/home/sections";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const landing = await getLandingContentFor("catalog");
  const filtered = countActiveFilters(filters) > 0 || !!filters.q || filters.page > 1 || filters.sort !== "featured";
  return pageMetadata({
    title: filters.q ? `Search results for “${filters.q}”` : landing?.seo.title || "Refurbished Laptops — Shop All",
    description:
      landing?.seo.description ||
      "Shop certified refurbished laptops from Dell, HP, Lenovo, Apple and more. Filter by processor, RAM, storage, price and condition grade.",
    path: "/laptops",
    // Filtered/sorted/searched variants canonicalise to /laptops and aren't indexed.
    noindex: filtered,
  });
}

export default async function LaptopsPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const [result, facets, landing, banners] = await Promise.all([
    listProducts(filters),
    getFacets({}),
    getLandingContentFor("catalog"),
    getBanners("catalog-top"),
  ]);

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Laptops", path: "/laptops" }]}
        title={filters.q ? `Results for “${filters.q}”` : landing?.heading || "Refurbished laptops"}
        description={filters.q ? null : landing?.intro}
      >
        {!filters.q && <LandingHighlights items={landing?.highlights ?? []} />}
      </PageHeader>
      {banners.slice(0, 1).map((b) => (
        <PromoBanner key={b.slug} banner={b} />
      ))}
      <CatalogView basePath="/laptops" filters={filters} facets={facets} result={result} />
      {!filters.q && filters.page === 1 && <LandingFooterContent landing={landing} title="Refurbished laptops" />}
    </>
  );
}
