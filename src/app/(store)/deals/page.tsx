import { Timer } from "lucide-react";
import { getBanners, getHomepage } from "@/lib/cms";
import { countActiveFilters, parseFilters } from "@/lib/filters";
import { pageMetadata } from "@/lib/seo";
import { getDeals, getFacets, listProducts } from "@/server/catalog";
import { PageHeader } from "@/components/layout/page-shell";
import { CatalogView } from "@/components/filters/catalog-view";
import { PromoBanner } from "@/components/home/sections";
import { Countdown } from "@/components/product/countdown";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  return pageMetadata({
    title: "Refurbished Laptop Deals — Limited Stock Offers",
    description:
      "Our lowest prices on tested, warranty-backed refurbished laptops. Limited units per deal — same inspection and warranty as every laptop we sell.",
    path: "/deals",
    noindex: countActiveFilters(filters) > 0 || filters.page > 1 || filters.sort !== "featured",
  });
}

export default async function DealsPage({ searchParams }: Props) {
  const filters = { ...parseFilters(await searchParams), deal: true };
  const [result, facets, home, banners, deals] = await Promise.all([
    listProducts(filters),
    getFacets({ deal: true }),
    getHomepage(),
    getBanners("deals-top"),
    getDeals(50),
  ]);
  const endsAt = deals
    .map((d) => d.dealEndsAt)
    .filter((d): d is string => !!d)
    .sort()[0];

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Deals", path: "/deals" }]}
        eyebrow="Limited stock"
        title={home?.sections.deals.title || "Laptop deals"}
        description={
          home?.sections.deals.subtitle ||
          "Our lowest prices on tested, warranty-backed laptops. Same inspection, same warranty."
        }
      >
        {endsAt && (
          <div className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-xl bg-primary px-4 py-3 text-white">
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <Timer className="size-4" aria-hidden /> Next deal ends in
            </span>
            <Countdown endsAt={endsAt} />
          </div>
        )}
      </PageHeader>
      {banners.slice(0, 1).map((b) => (
        <PromoBanner key={b.slug} banner={b} />
      ))}
      <CatalogView
        basePath="/deals"
        filters={filters}
        facets={facets}
        result={result}
        locked={{ deal: true }}
        emptyAction={{ label: "Browse all laptops", href: "/laptops" }}
      />
    </>
  );
}
