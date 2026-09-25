import { CartSkeleton } from "@/components/cart/cart-view";

export default function Loading() {
  return (
    <div className="container-page py-10">
      <div className="skeleton mb-8 h-9 w-56" />
      <CartSkeleton />
    </div>
  );
}
