/** Order status update schema (client-safe). */
import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/constants";

export const orderStatusSchema = z.object({
  orderId: z.string().min(1).max(64),
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500, "Keep the note under 500 characters."),
  courier: z.string().trim().max(80),
  trackingNumber: z.string().trim().max(80),
});

export type OrderStatusValues = z.infer<typeof orderStatusSchema>;
