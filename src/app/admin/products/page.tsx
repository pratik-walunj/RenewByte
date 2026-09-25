import type { Metadata } from "next";
import Link from "next/link";
import { Laptop, Plus } from "lucide-react";
import { getStaffUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { GRADE_SHORT } from "@/lib/constants";
import { listProducts, getCatalogOptions, type AdminProductRow } from "@/server/admin/products";
import { oneOf, pageParam, param, type SearchParams } from "@/server/admin/pagination";
import { PRODUCT_STATUSES } from "@/server/admin/schemas/product";
import { STOCK_LEVELS } from "@/server/admin/stock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { AdminPageHeader, CardItem, CardList, DataTable, FilterBar, FilterSelect, td, th } from "@/components/admin/ui";
import { AdminPagination } from "@/components/admin/pagination";
import { ProductStatusBadge, StockBadge, stockLevel } from "@/components/admin/badges";
import { ProductRowActions } from "@/components/admin/products/row-actions";

export const metadata: Metadata = { title: "Products" };

function Thumb({ p }: { p: AdminProductRow }) {
  const img = p.images[0];
  return (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-subtle">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails may come from any configured host
        <img src={img.url} alt="" className="size-full object-contain" loading="lazy" />
      ) : (
        <Laptop className="size-5 text-faint" aria-hidden />
      )}
    </div>
  );
}

function Flags({ p }: { p: AdminProductRow }) {
  return (
    <div className="flex flex-wrap gap-1">
      {p.isFeatured && <Badge tone="info">Featured</Badge>}
      {p.isBestSeller && <Badge tone="info">Best seller</Badge>}
      {p.isDeal && <Badge tone="info">Deal</Badge>}
    </div>
  );
}

function stock(p: AdminProductRow) {
  const available = p.inventory ? Math.max(0, p.inventory.quantity - p.inventory.reserved) : 0;
  return { available, level: stockLevel(available, p.inventory?.lowStockThreshold ?? 3) };
}

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const filters = {
    q: param(sp, "q"),
    status: oneOf(param(sp, "status"), PRODUCT_STATUSES),
    brand: param(sp, "brand"),
    category: param(sp, "category"),
    stock: oneOf(param(sp, "stock"), STOCK_LEVELS),
    page: pageParam(sp),
  };
  const [{ rows, info }, options, user] = await Promise.all([listProducts(filters), getCatalogOptions(), getStaffUser()]);
  const canDelete = user?.role === "ADMIN";
  const filtered = Boolean(filters.q || filters.status || filters.brand || filters.category || filters.stock);

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Every laptop listing, its price, stock and visibility."
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus /> New product
            </Link>
          </Button>
        }
      />

      <FilterBar action="/admin/products" query={filters.q} queryPlaceholder="Name, SKU or slug" resetHref="/admin/products">
        <FilterSelect
          name="status"
          label="Status"
          value={filters.status}
          options={[
            { value: "PUBLISHED", label: "Published" },
            { value: "DRAFT", label: "Draft" },
            { value: "ARCHIVED", label: "Archived" },
          ]}
        />
        <FilterSelect name="brand" label="Brand" value={filters.brand} options={options.brands} />
        <FilterSelect name="category" label="Category" value={filters.category} options={options.categories} />
        <FilterSelect
          name="stock"
          label="Stock"
          value={filters.stock}
          options={[
            { value: "in", label: "In stock" },
            { value: "low", label: "Low stock" },
            { value: "out", label: "Out of stock" },
          ]}
        />
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Laptop />}
          title={filtered ? "No products match these filters" : "No products yet"}
          description={filtered ? "Try a different search or reset the filters." : "Add your first refurbished laptop to start selling."}
        >
          {!filtered && (
            <Button asChild>
              <Link href="/admin/products/new">New product</Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <DataTable caption="Products">
            <thead className="border-b border-border bg-subtle/60">
              <tr>
                <th scope="col" className={th}>Product</th>
                <th scope="col" className={th}>Status</th>
                <th scope="col" className={`${th} text-right`}>Price</th>
                <th scope="col" className={th}>Stock</th>
                <th scope="col" className={th}>Merchandising</th>
                <th scope="col" className={`${th} w-12`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => {
                const s = stock(p);
                return (
                  <tr key={p.id} className="hover:bg-subtle/40">
                    <td className={td}>
                      <div className="flex min-w-0 items-center gap-3">
                        <Thumb p={p} />
                        <div className="min-w-0">
                          <Link href={`/admin/products/${p.id}`} className="line-clamp-1 font-medium hover:underline">
                            {p.name}
                          </Link>
                          <p className="truncate text-xs text-muted">
                            <span className="font-mono">{p.sku}</span> · {p.brand.name} · {p.category.name} · Grade{" "}
                            {GRADE_SHORT[p.conditionGrade]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={td}>
                      <ProductStatusBadge status={p.status} />
                    </td>
                    <td className={`${td} num text-right whitespace-nowrap`}>
                      <span className="font-medium">{formatPrice(p.price)}</span>
                      {p.mrp > p.price && <span className="block text-xs text-muted line-through">{formatPrice(p.mrp)}</span>}
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="num w-6 text-right">{s.available}</span>
                        <StockBadge level={s.level} />
                      </div>
                    </td>
                    <td className={td}>
                      <Flags p={p} />
                    </td>
                    <td className={`${td} text-right`}>
                      <ProductRowActions
                        id={p.id}
                        name={p.name}
                        slug={p.slug}
                        status={p.status}
                        flags={{ isFeatured: p.isFeatured, isBestSeller: p.isBestSeller, isDeal: p.isDeal }}
                        canDelete={canDelete}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>

          <CardList label="Products">
            {rows.map((p) => {
              const s = stock(p);
              return (
                <CardItem key={p.id}>
                  <div className="flex min-w-0 items-start gap-3">
                    <Thumb p={p} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/products/${p.id}`} className="line-clamp-2 text-sm font-medium hover:underline">
                        {p.name}
                      </Link>
                      <p className="truncate font-mono text-xs text-muted">{p.sku}</p>
                    </div>
                    <ProductRowActions
                      id={p.id}
                      name={p.name}
                      slug={p.slug}
                      status={p.status}
                      flags={{ isFeatured: p.isFeatured, isBestSeller: p.isBestSeller, isDeal: p.isDeal }}
                      canDelete={canDelete}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ProductStatusBadge status={p.status} />
                    <StockBadge level={s.level} />
                    <span className="num ml-auto text-sm font-medium">{formatPrice(p.price)}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {s.available} available · {p.brand.name} · {p.category.name}
                  </p>
                  {(p.isFeatured || p.isBestSeller || p.isDeal) && (
                    <div className="mt-2">
                      <Flags p={p} />
                    </div>
                  )}
                </CardItem>
              );
            })}
          </CardList>

          <AdminPagination info={info} basePath="/admin/products" searchParams={sp} noun="products" />
        </>
      )}
    </>
  );
}
