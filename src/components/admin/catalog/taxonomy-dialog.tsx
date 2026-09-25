"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { slugify } from "@/lib/utils";
import { saveTaxonomy } from "@/app/actions/admin/catalog";
import { taxonomySchema, type TaxonomyValues } from "@/server/admin/schemas/taxonomy";
import { CheckboxField, Grid, NumberField, TextAreaField, TextField } from "@/components/admin/form/fields";

type Kind = "brand" | "category";

const blank = (kind: Kind): TaxonomyValues => ({
  kind,
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  isActive: true,
  sortOrder: 0,
  seoTitle: "",
  seoDescription: "",
});

/** Create/edit dialog for a brand or category. */
export function TaxonomyDialog({ kind, id, initial }: { kind: Kind; id?: string; initial?: TaxonomyValues }) {
  const [open, setOpen] = useState(false);
  const noun = kind === "brand" ? "brand" : "category";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {id ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${initial?.name ?? noun}`}>
            <Pencil />
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> New {noun}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogTitle>{id ? `Edit ${noun}` : `New ${noun}`}</DialogTitle>
        <DialogDescription className="mt-1">
          {kind === "brand" ? "Brands group laptops by manufacturer." : "Categories group laptops by use or type."}
        </DialogDescription>
        {open && <TaxonomyForm id={id ?? null} initial={initial ?? blank(kind)} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TaxonomyForm({ id, initial, onDone }: { id: string | null; initial: TaxonomyValues; onDone: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [autoSlug, setAutoSlug] = useState(id === null);
  const form = useForm<TaxonomyValues>({ resolver: zodResolver(taxonomySchema), defaultValues: initial });

  function onValid(values: TaxonomyValues) {
    startTransition(async () => {
      const res = await saveTaxonomy(id, values);
      if (!res.ok) {
        for (const [k, m] of Object.entries(res.fieldErrors ?? {})) {
          if (m?.[0]) form.setError(k as Path<TaxonomyValues>, { message: m[0] });
        }
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Saved");
      onDone();
      router.refresh();
    });
  }

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onValid)} className="mt-5 flex flex-col gap-4">
        <Grid>
          <TextField name="name" label="Name" onValueChange={(v) => autoSlug && form.setValue("slug", slugify(v))} />
          <TextField name="slug" label="Slug" className="font-mono" onValueChange={() => setAutoSlug(false)} />
        </Grid>
        <TextAreaField name="description" label="Description" optional rows={3} />
        <TextField
          name="imageUrl"
          label={initial.kind === "brand" ? "Logo URL" : "Image URL"}
          optional
          placeholder="https://res.cloudinary.com/…"
        />
        <Grid>
          <NumberField name="sortOrder" label="Sort order" hint="Lower numbers appear first" />
          <div className="sm:pt-7">
            <CheckboxField name="isActive" label="Active" hint="Inactive ones are hidden from the store." />
          </div>
        </Grid>
        <details className="rounded-lg border border-border p-3">
          <summary className="cursor-pointer text-sm font-medium">Search engine listing</summary>
          <div className="mt-3 flex flex-col gap-4">
            <TextField name="seoTitle" label="SEO title" optional maxLength={70} />
            <TextAreaField name="seoDescription" label="Meta description" optional rows={2} maxLength={160} />
          </div>
        </details>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
