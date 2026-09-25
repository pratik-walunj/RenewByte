import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { env } from "@/lib/env";
import { requireStaff } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { getCatalogOptions, getProductForEdit } from "@/server/admin/products";
import { AdminPageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ProductStatusBadge } from "@/components/admin/badges";
import { ProductForm } from "@/components/admin/products/form/product-form";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getProductForEdit(id);
  return { title: data ? `Edit ${data.values.name}` : "Product not found" };
}

export default async function EditProductPage({ params }: Props) {
  await requireStaff();
  const { id } = await params;
  const [data, options] = await Promise.all([getProductForEdit(id), getCatalogOptions()]);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        back={{ href: "/admin/products", label: "Products" }}
        eyebrow={data.values.sku}
        title={data.values.name}
        description={
          <span className="flex flex-wrap items-center gap-2 text-[13px]">
            <ProductStatusBadge status={data.meta.status} />
            Last updated {formatDateTime(data.meta.updatedAt)}
            {data.meta.orderItemCount > 0 && <> · in {data.meta.orderItemCount} order lines</>}
          </span>
        }
        actions={
          data.meta.status === "PUBLISHED" ? (
            <Button asChild variant="outline" size="sm">
              <a href={`/laptops/${data.meta.slug}`} target="_blank" rel="noopener">
                <ExternalLink /> View in store
              </a>
            </Button>
          ) : undefined
        }
      />
      <ProductForm
        key={data.meta.updatedAt.toISOString()}
        productId={data.meta.id}
        initial={data.values}
        brands={options.brands}
        categories={options.categories}
        cloudinaryEnabled={env.cloudinary.configured}
        stock={data.meta.stock}
      />
    </div>
  );
}
