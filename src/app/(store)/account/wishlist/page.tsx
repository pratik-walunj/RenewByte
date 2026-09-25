import { redirect } from "next/navigation";

/** The wishlist lives at /wishlist (it also works for guests). */
export default function AccountWishlistPage() {
  redirect("/wishlist");
}
