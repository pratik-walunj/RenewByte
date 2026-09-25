/**
 * Product form schema — imported by the client form (zodResolver) and re-validated
 * by the server action. Client-safe: no server imports.
 */
import { z } from "zod";
import { CONDITION_GRADES } from "@/lib/constants";

export const PRODUCT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const STORAGE_TYPES = ["NVME_SSD", "SSD", "HDD", "EMMC"] as const;
export const GPU_TYPES = ["INTEGRATED", "DEDICATED"] as const;

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
const required = (label: string, max = 120) => text(max).min(1, `${label} is required.`);
const int = (label: string, min: number, max: number) =>
  z
    .number({ error: `${label} must be a number.` })
    .int(`${label} must be a whole number.`)
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} must be at most ${max}.`);

const listItem = z.object({ value: text(200) });

export const productSchema = z
  .object({
    // Basics
    name: required("Name", 160).min(3, "Name must be at least 3 characters."),
    slug: required("Slug", 120).regex(slugRegex, "Use lowercase letters, numbers and single hyphens."),
    sku: required("SKU", 64).regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, dots, dashes or underscores."),
    brandId: z.string().min(1, "Choose a brand."),
    categoryId: z.string().min(1, "Choose a category."),
    status: z.enum(PRODUCT_STATUSES),
    shortDescription: text(300),
    description: text(10_000),
    // Pricing (rupees in the form, paise in the database)
    mrpRupees: z.number({ error: "Enter the MRP." }).positive("MRP must be above zero.").max(10_000_000),
    priceRupees: z.number({ error: "Enter the selling price." }).positive("Price must be above zero.").max(10_000_000),
    // Condition & warranty
    conditionGrade: z.enum(CONDITION_GRADES),
    warrantyMonths: int("Warranty", 0, 60),
    batteryHealth: int("Battery health", 0, 100).nullable(),
    batteryBackup: text(80),
    // Specs
    processor: required("Processor"),
    processorBrand: required("Processor brand", 40),
    processorFamily: required("Processor family", 40),
    processorGeneration: text(40),
    ramGb: int("RAM", 1, 512),
    ramType: text(40),
    storageGb: int("Storage", 1, 32_768),
    storageType: z.enum(STORAGE_TYPES),
    displaySize: z.number({ error: "Enter the display size." }).min(7, "Too small.").max(21, "Too large."),
    resolution: text(60),
    displayType: text(60),
    graphics: required("Graphics"),
    gpuType: z.enum(GPU_TYPES),
    operatingSystem: required("Operating system", 80),
    weightKg: z.number().min(0.3, "Too light.").max(10, "Too heavy.").nullable(),
    color: text(40),
    keyboard: text(80),
    // Lists
    highlights: z.array(listItem).max(12),
    features: z.array(listItem).max(30),
    ports: z.array(listItem).max(20),
    whatsIncluded: z.array(listItem).max(12),
    specifications: z
      .array(z.object({ group: text(60), label: required("Label", 80), value: required("Value", 200) }))
      .max(60),
    // Images
    images: z
      .array(
        z.object({
          url: z
            .string()
            .trim()
            .min(1, "Image URL is required.")
            .max(500)
            .refine((v) => v.startsWith("/") || /^https:\/\//.test(v), "Use an https:// URL or a site path."),
          alt: required("Alt text", 160),
          publicId: z.string().max(200).nullable(),
        }),
      )
      .max(12, "Up to 12 images."),
    // Merchandising
    isFeatured: z.boolean(),
    isBestSeller: z.boolean(),
    isDeal: z.boolean(),
    dealEndsAt: z.string().max(40),
    // Inventory (used when creating)
    quantity: int("Quantity", 0, 100_000),
    lowStockThreshold: int("Threshold", 0, 1_000),
    // SEO
    seoTitle: text(70),
    seoDescription: text(170),
  })
  .superRefine((v, ctx) => {
    if (v.priceRupees > v.mrpRupees) {
      ctx.addIssue({ code: "custom", path: ["priceRupees"], message: "Selling price can't exceed MRP." });
    }
    if (v.status === "PUBLISHED" && v.images.length === 0) {
      ctx.addIssue({ code: "custom", path: ["images"], message: "Add at least one image before publishing." });
    }
    if (v.dealEndsAt && !/^\d{4}-\d{2}-\d{2}$/.test(v.dealEndsAt)) {
      ctx.addIssue({ code: "custom", path: ["dealEndsAt"], message: "Enter a valid date." });
    }
  });

export type ProductFormValues = z.infer<typeof productSchema>;

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  brandId: "",
  categoryId: "",
  status: "DRAFT",
  shortDescription: "",
  description: "",
  mrpRupees: Number.NaN,
  priceRupees: Number.NaN,
  conditionGrade: "A",
  warrantyMonths: 6,
  batteryHealth: null,
  batteryBackup: "",
  processor: "",
  processorBrand: "Intel",
  processorFamily: "",
  processorGeneration: "",
  ramGb: 8,
  ramType: "DDR4",
  storageGb: 256,
  storageType: "SSD",
  displaySize: 14,
  resolution: "1920 × 1080",
  displayType: "",
  graphics: "",
  gpuType: "INTEGRATED",
  operatingSystem: "Windows 11 Pro",
  weightKg: null,
  color: "",
  keyboard: "",
  highlights: [],
  features: [],
  ports: [],
  whatsIncluded: [],
  specifications: [],
  images: [],
  isFeatured: false,
  isBestSeller: false,
  isDeal: false,
  dealEndsAt: "",
  quantity: 1,
  lowStockThreshold: 3,
  seoTitle: "",
  seoDescription: "",
};
