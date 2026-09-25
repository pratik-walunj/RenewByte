/** Stock adjustment schema (client-safe; shared by the dialog and the server action). */
import { z } from "zod";

export const adjustStockSchema = z.object({
  productId: z.string().min(1).max(64),
  mode: z.enum(["set", "delta"]),
  amount: z
    .number({ error: "Enter a number." })
    .int("Use a whole number.")
    .min(-100_000)
    .max(100_000),
  reason: z.string().trim().min(3, "Give a short reason (at least 3 characters).").max(200),
  lowStockThreshold: z.number({ error: "Enter a number." }).int().min(0).max(1_000),
});

export type AdjustStockValues = z.infer<typeof adjustStockSchema>;
