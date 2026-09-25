import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";
import { requireStaff } from "@/lib/auth/session";
import { getCatalogOptions } from "@/server/admin/products";
import { getStoreSettings } from "@/server/settings";
import { EMPTY_PRODUCT } from "@/server/admin/schemas/product";
import { AdminPageHeader } from "@/components/admin/ui";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/products/form/product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireStaff();
  const [options, settings] = await Promise.all([getCatalogOptions(), getStoreSettings()]);

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader back={{ href: "/admin/products", label: "Products" }} title="New product" />
      {options.brands.length === 0 || options.categories.length === 0 ? (
        <EmptyState
          title="Add a brand and a category first"
          description="Every product belongs to one brand and one category."
        >
          <Button asChild>
            <Link href="/admin/catalog">Go to brands & categories</Link>
          </Button>
        </EmptyState>
      ) : (
        <ProductForm
          productId={null}
          initial={{ ...EMPTY_PRODUCT, lowStockThreshold: settings.lowStockThreshold }}
          brands={options.brands}
          categories={options.categories}
          cloudinaryEnabled={env.cloudinary.configured}
        />
      )}
    </div>
  );
}
