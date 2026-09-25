/** Coupon form schema (client-safe; re-validated by the server action). */
import { z } from "zod";

const optionalInt = (label: string, min = 1) =>
  z.number({ error: `${label} must be a number.` }).int(`${label} must be a whole number.`).min(min, `${label} must be at least ${min}.`).nullable();

const dateStr = z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Enter a valid date.");

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Use at least 3 characters.")
      .max(32, "Use at most 32 characters.")
      .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, dashes and underscores only."),
    description: z.string().trim().max(200),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.number({ error: "Enter a value." }).positive("Must be above zero.").max(10_000_000),
    minOrderRupees: z.number({ error: "Enter a number (0 for none)." }).min(0).max(10_000_000),
    maxDiscountRupees: z.number().positive("Must be above zero.").max(10_000_000).nullable(),
    startsAt: dateStr,
    expiresAt: dateStr,
    usageLimit: optionalInt("Usage limit"),
    perUserLimit: optionalInt("Per-customer limit"),
    isActive: z.boolean(),
    productIds: z.array(z.string().min(1).max(64)).max(500),
    categoryIds: z.array(z.string().min(1).max(64)).max(100),
  })
  .superRefine((v, ctx) => {
    if (v.type === "PERCENTAGE" && (!Number.isInteger(v.value) || v.value > 100)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Use a whole percentage from 1 to 100." });
    }
    if (v.startsAt && v.expiresAt && v.expiresAt < v.startsAt) {
      ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry must be on or after the start date." });
    }
  });

export type CouponFormValues = z.infer<typeof couponSchema>;

export const EMPTY_COUPON: CouponFormValues = {
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: 10,
  minOrderRupees: 0,
  maxDiscountRupees: null,
  startsAt: "",
  expiresAt: "",
  usageLimit: null,
  perUserLimit: 1,
  isActive: true,
  productIds: [],
  categoryIds: [],
};
