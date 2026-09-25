import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/layout/page-shell";
import { CompareTable } from "@/components/product/compare-table";

export async function generateMetadata() {
  return pageMetadata({
    title: "Compare Laptops",
    description: "Compare refurbished laptops side by side — price, processor, RAM, storage, battery health, warranty and condition.",
    path: "/compare",
    noindex: true,
  });
}

export default function ComparePage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Compare", path: "/compare" }]}
        title="Compare laptops"
        description="Up to four laptops side by side. The best value in each row is highlighted."
      />
      <div className="container-page py-8 sm:py-10">
        <CompareTable />
      </div>
    </>
  );
}
