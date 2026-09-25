"use client";

import Link from "next/link";
import { useWatch } from "react-hook-form";
import { CheckboxField, FormSection, Grid, NumberField, TextAreaField, TextField } from "@/components/admin/form/fields";

export function MerchandisingSection() {
  const isDeal = useWatch({ name: "isDeal" }) as boolean;
  return (
    <FormSection id="merchandising" title="Merchandising" description="Where this laptop is promoted on the storefront.">
      <CheckboxField name="isFeatured" label="Featured" hint="Eligible for homepage and featured rails." />
      <CheckboxField name="isBestSeller" label="Best seller" hint="Shows a Best seller label and appears in best-seller lists." />
      <CheckboxField name="isDeal" label="Deal" hint="Appears on the deals page." />
      {isDeal && (
        <TextField name="dealEndsAt" label="Deal ends on" type="date" optional hint="Ends at 11:59 pm IST. Leave blank for no end date." className="sm:max-w-60" />
      )}
    </FormSection>
  );
}

export function InventorySection({
  isNew,
  sku,
  stock,
}: {
  isNew: boolean;
  sku?: string;
  stock?: { quantity: number; reserved: number } | null;
}) {
  if (!isNew) {
    return (
      <FormSection id="inventory" title="Inventory">
        <p className="text-sm text-muted">
          {stock ? (
            <>
              <span className="num font-medium text-foreground">{stock.quantity}</span> in stock,{" "}
              <span className="num font-medium text-foreground">{stock.reserved}</span> reserved for unpaid orders.{" "}
            </>
          ) : (
            "No stock record yet. "
          )}
          Stock changes are logged, so adjust them from{" "}
          <Link href={`/admin/inventory?q=${encodeURIComponent(sku ?? "")}`} className="font-medium text-accent hover:underline">
            Inventory
          </Link>
          .
        </p>
      </FormSection>
    );
  }
  return (
    <FormSection id="inventory" title="Inventory" description="Opening stock. Later changes are made from Inventory with a reason.">
      <Grid>
        <NumberField name="quantity" label="Quantity on hand" min={0} />
        <NumberField name="lowStockThreshold" label="Low-stock threshold" min={0} hint="Flag as low stock at or below this number" />
      </Grid>
    </FormSection>
  );
}

export function SeoSection() {
  return (
    <FormSection id="seo" title="Search engine listing" description="Leave blank to use the product name and short description.">
      <TextField name="seoTitle" label="SEO title" optional maxLength={70} />
      <SeoTitleCounter />
      <TextAreaField name="seoDescription" label="Meta description" optional rows={3} maxLength={160} hint="Aim for 120–160 characters" />
    </FormSection>
  );
}

function SeoTitleCounter() {
  const value = (useWatch({ name: "seoTitle" }) as string | undefined) ?? "";
  return (
    <p className="-mt-2 text-[13px] text-muted num" aria-live="polite">
      {value.length}/70 characters{value.length > 60 ? " — may be truncated in results" : ""}
    </p>
  );
}
