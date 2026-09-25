"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import type { Option } from "@/server/admin/types";
import { FormSection, Grid, SelectField, TextAreaField, TextField } from "@/components/admin/form/fields";

export function BasicsSection({ isNew, brands, categories }: { isNew: boolean; brands: Option[]; categories: Option[] }) {
  const { setValue, getValues } = useFormContext();
  // New products keep the slug in sync with the name until the slug is edited by hand.
  const [autoSlug, setAutoSlug] = useState(isNew);

  return (
    <FormSection id="basics" title="Basics" description="Name, identifiers and where the product appears.">
      <TextField
        name="name"
        label="Product name"
        placeholder="Dell Latitude 7490 — Core i5 8th Gen, 16GB, 512GB SSD"
        onValueChange={(v) => autoSlug && setValue("slug", slugify(v), { shouldValidate: false })}
      />
      <Grid>
        <div className="flex flex-col gap-1.5">
          <TextField
            name="slug"
            label="URL slug"
            hint="Used in /laptops/<slug>. Changing it breaks existing links."
            onValueChange={() => setAutoSlug(false)}
            className="font-mono"
          />
          <Button
            type="button"
            variant="link"
            size="sm"
            className="w-fit"
            onClick={() => setValue("slug", slugify(getValues("name") ?? ""), { shouldValidate: true, shouldDirty: true })}
          >
            <Wand2 /> Generate from name
          </Button>
        </div>
        <TextField name="sku" label="SKU" hint="Unique stock code, e.g. RB-DL7490-I5-16-512." autoCapitalize="characters" />
      </Grid>
      <Grid cols={3}>
        <SelectField name="brandId" label="Brand" options={brands} placeholder="Choose a brand" />
        <SelectField name="categoryId" label="Category" options={categories} placeholder="Choose a category" />
        <SelectField
          name="status"
          label="Status"
          options={[
            { value: "DRAFT", label: "Draft — hidden" },
            { value: "PUBLISHED", label: "Published — live" },
            { value: "ARCHIVED", label: "Archived" },
          ]}
        />
      </Grid>
      <TextAreaField name="shortDescription" label="Short description" optional rows={2} maxLength={300} hint="Shown on cards and in search results" />
      <TextAreaField name="description" label="Description" optional rows={8} hint="Plain text; blank lines start new paragraphs" />
    </FormSection>
  );
}
