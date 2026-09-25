import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/layout/page-shell";
import { WishlistView } from "@/components/product/wishlist-view";

export async function generateMetadata() {
  return pageMetadata({ title: "Wishlist", description: "Laptops you've saved for later.", path: "/wishlist", noindex: true });
}

export default function WishlistPage() {
  return (
    <>
      <PageHeader crumbs={[{ name: "Wishlist", path: "/wishlist" }]} title="Your wishlist" />
      <div className="container-page max-w-5xl py-8 sm:py-10">
        <WishlistView />
      </div>
    </>
  );
}
