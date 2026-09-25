import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/layout/page-shell";
import { CartView } from "@/components/cart/cart-view";

export async function generateMetadata() {
  return pageMetadata({ title: "Your Cart", description: "Review the laptops in your cart.", path: "/cart", noindex: true });
}

export default function CartPage() {
  return (
    <>
      <PageHeader crumbs={[{ name: "Cart", path: "/cart" }]} title="Shopping cart" />
      <div className="container-page py-8 sm:py-10">
        <CartView />
      </div>
    </>
  );
}
