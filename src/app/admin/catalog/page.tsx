import type { Metadata } from "next";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { getStaffUser } from "@/lib/auth/session";
import { listTaxonomies, type TaxonomyRow } from "@/server/admin/catalog";
import { deleteTaxonomy } from "@/app/actions/admin/catalog";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-dialog";
import { TaxonomyDialog } from "@/components/admin/catalog/taxonomy-dialog";

export const metadata: Metadata = { title: "Brands & categories" };

function TaxonomyList({ kind, rows, canDelete }: { kind: "brand" | "category"; rows: TaxonomyRow[]; canDelete: boolean }) {
  if (rows.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-muted">None yet.</p>;
  }
  const filterKey = kind === "brand" ? "brand" : "category";
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li key={r.id} className="flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <span className="truncate">{r.values.name}</span>
              {!r.values.isActive && <Badge tone="outline">Inactive</Badge>}
            </p>
            <p className="truncate text-xs text-muted">
              <span className="font-mono">/{r.values.slug}</span> · order {r.values.sortOrder} ·{" "}
              <Link href={`/admin/products?${filterKey}=${r.id}`} className="hover:underline">
                {r.productCount} {r.productCount === 1 ? "product" : "products"}
              </Link>
            </p>
          </div>
          <TaxonomyDialog kind={kind} id={r.id} initial={r.values} />
          {canDelete && (
            <ConfirmButton
              buttonProps={{ variant: "ghost", size: "icon-sm", "aria-label": `Delete ${r.values.name}`, disabled: r.productCount > 0, title: r.productCount > 0 ? "In use by products" : undefined }}
              title={`Delete ${r.values.name}?`}
              description={`This ${kind} will be removed permanently.`}
              confirmLabel="Delete"
              action={deleteTaxonomy.bind(null, kind, r.id)}
            >
              <Trash2 />
            </ConfirmButton>
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function CatalogPage() {
  const [{ brands, categories }, user] = await Promise.all([listTaxonomies(), getStaffUser()]);
  const canDelete = user?.role === "ADMIN";
  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Brands & categories"
        description="Organise products for browsing and filters. Items in use by products can't be deleted — mark them inactive instead."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel id="brands" title={`Brands (${brands.length})`} action={<TaxonomyDialog kind="brand" />} bodyClassName="p-0 sm:p-0">
          <TaxonomyList kind="brand" rows={brands} canDelete={canDelete} />
        </Panel>
        <Panel
          id="categories"
          title={`Categories (${categories.length})`}
          action={<TaxonomyDialog kind="category" />}
          bodyClassName="p-0 sm:p-0"
        >
          <TaxonomyList kind="category" rows={categories} canDelete={canDelete} />
        </Panel>
      </div>
    </>
  );
}
