import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";
import { MAX_ADDRESSES } from "@/lib/validation/auth";
import { AccountHeading } from "@/components/account/account-heading";
import { AddressManager } from "@/components/account/address-manager";

export async function generateMetadata() {
  return pageMetadata({ title: "Addresses", path: "/account/addresses", noindex: true });
}

export default async function AccountAddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      label: true,
      fullName: true,
      phone: true,
      line1: true,
      line2: true,
      landmark: true,
      city: true,
      state: true,
      pincode: true,
      isDefault: true,
    },
  });

  return (
    <>
      <AccountHeading
        title="Addresses"
        description={`Save up to ${MAX_ADDRESSES} delivery addresses. Your default address is pre-filled at checkout.`}
      />
      <AddressManager addresses={addresses} defaults={{ fullName: user.name, phone: user.phone ?? "" }} />
    </>
  );
}
