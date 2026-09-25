import { notFound } from "next/navigation";
import { getLandingContentFor } from "@/lib/cms";
import { countActiveFilters, parseFilters } from "@/lib/filters";
import { pageMetadata } from "@/lib/seo";
import { getCategory, getFacets, listProducts } from "@/server/catalog";
import { PageHeader } from "@/components/layout/page-shell";
import { CatalogView } from "@/components/filters/catalog-view";
import { LandingFooterContent, LandingHighlights } from "@/components/filters/landing-content";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const [category, landing, sp] = await Promise.all([getCategory(slug), getLandingContentFor("category", slug), searchParams]);
  if (!category) return {};
  const filters = parseFilters(sp);
  return pageMetadata({
    title: landing?.seo.title || category.seoTitle || `Refurbished ${category.name}`,
    description:
      landing?.seo.description ||
      category.seoDescription ||
      `Shop refurbished ${category.name.toLowerCase()} — tested, graded and backed by warranty.`,
    path: `/category/${slug}`,
    noindex: countActiveFilters(filters) > 0 || filters.page > 1 || filters.sort !== "featured",
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const filters = { ...parseFilters(await searchParams), category: [slug] };
  const [result, facets, landing] = await Promise.all([
    listProducts(filters),
    getFacets({ category: slug }),
    getLandingContentFor("category", slug),
  ]);

  const title = landing?.heading || `Refurbished ${category.name}`;
  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Laptops", path: "/laptops" },
          { name: category.name, path: `/category/${slug}` },
        ]}
        title={title}
        description={landing?.intro || category.description}
      >
        <LandingHighlights items={landing?.highlights ?? []} />
      </PageHeader>
      <CatalogView
        basePath={`/category/${slug}`}
        filters={filters}
        facets={facets}
        result={result}
        locked={{ category: true }}
        emptyAction={{ label: "Browse all laptops", href: "/laptops" }}
      />
      {filters.page === 1 && <LandingFooterContent landing={landing} title={title} />}
    </>
  );
}
