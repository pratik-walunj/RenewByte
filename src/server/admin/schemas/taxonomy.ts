/** Brand / category schema (client-safe). `imageUrl` maps to Brand.logoUrl or Category.imageUrl. */
import { z } from "zod";
import { slugRegex } from "@/server/admin/schemas/product";

export const taxonomySchema = z.object({
  kind: z.enum(["brand", "category"]),
  name: z.string().trim().min(2, "Name is required.").max(80),
  slug: z.string().trim().min(1, "Slug is required.").max(80).regex(slugRegex, "Use lowercase letters, numbers and single hyphens."),
  description: z.string().trim().max(2000),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || v.startsWith("/") || /^https:\/\//.test(v), "Use an https:// URL or a site path."),
  isActive: z.boolean(),
  sortOrder: z.number({ error: "Enter a number." }).int().min(-1000).max(1000),
  seoTitle: z.string().trim().max(70),
  seoDescription: z.string().trim().max(170),
});

export type TaxonomyValues = z.infer<typeof taxonomySchema>;
