import type { Metadata } from "next";
import Link from "next/link";
import { Boxes } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { listInventory, recentAdjustments } from "@/server/admin/inventory";
import { oneOf, pageParam, param, type SearchParams } from "@/server/admin/pagination";
import { STOCK_LEVELS } from "@/server/admin/stock";
import { EmptyState } from "@/components/ui/misc";
import { AdminPageHeader, CardItem, CardList, DataTable, FilterBar, FilterSelect, Meta, Panel, td, th } from "@/components/admin/ui";
import { AdminPagination } from "@/components/admin/pagination";
import { StockBadge, stockLevel } from "@/components/admin/badges";
import { AdjustStockDialog } from "@/components/admin/inventory/adjust-dialog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const filters = { q: param(sp, "q"), stock: oneOf(param(sp, "stock"), STOCK_LEVELS), page: pageParam(sp) };
  const [{ rows, info }, history] = await Promise.all([listInventory(filters), recentAdjustments()]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Inventory"
        description="Available = on hand − reserved. Reserved units are held by online orders awaiting payment."
      />

      <FilterBar action="/admin/inventory" query={filters.q} queryPlaceholder="Product name or SKU" resetHref="/admin/inventory">
        <FilterSelect
          name="stock"
          label="Status"
          value={filters.stock}
          options={[
            { value: "in", label: "In stock" },
            { value: "low", label: "Low stock" },
            { value: "out", label: "Out of stock" },
          ]}
        />
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState icon={<Boxes />} title="No products found" description="Try another search or status." />
      ) : (
        <>
          <DataTable caption="Stock levels">
            <thead className="border-b border-border bg-subtle/60">
              <tr>
                <th scope="col" className={th}>SKU</th>
                <th scope="col" className={th}>Product</th>
                <th scope="col" className={`${th} text-right`}>On hand</th>
                <th scope="col" className={`${th} text-right`}>Reserved</th>
                <th scope="col" className={`${th} text-right`}>Available</th>
                <th scope="col" className={`${th} text-right`}>Threshold</th>
                <th scope="col" className={th}>Status</th>
                <th scope="col" className={th}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-subtle/40">
                  <td className={`${td} font-mono text-xs whitespace-nowrap`}>{r.sku}</td>
                  <td className={td}>
                    <Link href={`/admin/products/${r.id}`} className="line-clamp-1 font-medium hover:underline">
                      {r.name}
                    </Link>
                    {r.status === "DRAFT" && <span className="text-xs text-muted">Draft</span>}
                  </td>
                  <td className={`${td} num text-right`}>{r.quantity}</td>
                  <td className={`${td} num text-right text-muted`}>{r.reserved}</td>
                  <td className={`${td} num text-right font-semibold`}>{r.available}</td>
                  <td className={`${td} num text-right text-muted`}>{r.threshold}</td>
                  <td className={td}>
                    <StockBadge level={stockLevel(r.available, r.threshold)} />
                  </td>
                  <td className={`${td} text-right`}>
                    <AdjustStockDialog row={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>

          <CardList label="Stock levels">
            {rows.map((r) => (
              <CardItem key={r.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/admin/products/${r.id}`} className="line-clamp-2 text-sm font-medium hover:underline">
                      {r.name}
                    </Link>
                    <p className="truncate font-mono text-xs text-muted">{r.sku}</p>
                  </div>
                  <StockBadge level={stockLevel(r.available, r.threshold)} />
                </div>
                <dl className="num mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                  <Meta label="On hand">{r.quantity}</Meta>
                  <Meta label="Reserved">{r.reserved}</Meta>
                  <Meta label="Available">
                    <strong>{r.available}</strong>
                  </Meta>
                  <Meta label="Threshold">{r.threshold}</Meta>
                </dl>
                <div className="mt-3">
                  <AdjustStockDialog row={r} />
                </div>
              </CardItem>
            ))}
          </CardList>

          <AdminPagination info={info} basePath="/admin/inventory" searchParams={sp} noun="products" />
        </>
      )}

      <Panel id="history" title="Recent adjustments" className="mt-8" bodyClassName="p-0 sm:p-0">
        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No stock changes recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {history.map((h) => (
              <li key={h.id} className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <Link href={`/admin/products/${h.inventory.product.id}`} className="block truncate text-sm font-medium hover:underline">
                    {h.inventory.product.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {h.reason} · {h.user?.name ?? "System"} · {formatDateTime(h.createdAt)}
                  </p>
                </div>
                <span className={cn("num text-sm font-semibold", h.change > 0 ? "text-success" : "text-sale")}>
                  {h.change > 0 ? `+${h.change}` : h.change}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
