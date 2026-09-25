"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveProduct } from "@/app/actions/admin/products";
import { productSchema, type ProductFormValues } from "@/server/admin/schemas/product";
import type { Option } from "@/server/admin/types";
import { BasicsSection } from "./basics-section";
import { ConditionSection, PricingSection } from "./pricing-section";
import { SpecsSection } from "./specs-section";
import { ListsSection, SpecRowsSection } from "./lists-section";
import { ImagesSection } from "./images-section";
import { InventorySection, MerchandisingSection, SeoSection } from "./extra-sections";

const SECTIONS = [
  ["basics", "Basics"],
  ["pricing", "Pricing"],
  ["condition", "Condition"],
  ["specs", "Specs"],
  ["lists", "Lists"],
  ["spec-rows", "Extra rows"],
  ["images", "Images"],
  ["merchandising", "Merchandising"],
  ["inventory", "Inventory"],
  ["seo", "SEO"],
] as const;

export function ProductForm({
  productId,
  initial,
  brands,
  categories,
  cloudinaryEnabled,
  stock,
}: {
  productId: string | null;
  initial: ProductFormValues;
  brands: Option[];
  categories: Option[];
  cloudinaryEnabled: boolean;
  stock?: { quantity: number; reserved: number } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initial,
    mode: "onTouched",
  });
  const isNew = productId === null;

  function onValid(values: ProductFormValues) {
    startTransition(async () => {
      const res = await saveProduct(productId, values);
      if (!res.ok) {
        for (const [field, messages] of Object.entries(res.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(field as Path<ProductFormValues>, { message: messages[0] }, { shouldFocus: true });
        }
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Saved");
      if (isNew) {
        router.push(`/admin/products/${res.id}`);
      } else {
        form.reset(values);
        router.refresh();
      }
    });
  }

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onValid, () => toast.error("Please fix the highlighted fields."))}
        className="flex min-w-0 flex-col gap-4"
      >
        <nav aria-label="Form sections" className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] text-muted hover:border-border-strong hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>

        <BasicsSection isNew={isNew} brands={brands} categories={categories} />
        <PricingSection />
        <ConditionSection />
        <SpecsSection />
        <ListsSection />
        <SpecRowsSection />
        <ImagesSection cloudinaryEnabled={cloudinaryEnabled} productName={initial.name} />
        <MerchandisingSection />
        <InventorySection isNew={isNew} sku={initial.sku} stock={stock} />
        <SeoSection />

        <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
          <p className="mr-auto text-[13px] text-muted" aria-live="polite">
            {form.formState.isDirty ? "Unsaved changes" : isNew ? "New product" : "All changes saved"}
          </p>
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/products")} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
