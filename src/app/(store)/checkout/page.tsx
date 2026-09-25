import Link from "next/link";
import { Lock } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export async function generateMetadata() {
  return pageMetadata({ title: "Checkout", description: "Secure checkout.", path: "/checkout", noindex: true });
}

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const addresses = user
    ? await db.address.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
        take: 6,
        select: { id: true, fullName: true, phone: true, line1: true, line2: true, landmark: true, city: true, state: true, pincode: true, isDefault: true },
      })
    : [];

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">
            <Link href="/cart" className="hover:text-foreground">
              Cart
            </Link>{" "}
            / Checkout
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
        </div>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted">
          <Lock className="size-4" aria-hidden /> Secure checkout
        </p>
      </div>
      <CheckoutForm
        signedIn={!!user}
        addresses={addresses}
        defaults={{ name: user?.name ?? addresses[0]?.fullName, email: user?.email, phone: user?.phone ?? addresses[0]?.phone }}
      />
    </div>
  );
}
