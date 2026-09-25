import { z } from "zod";
import { INDIAN_STATES } from "@/lib/constants";

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?91(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"));

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120),
  phone,
});

export const addressSchema = z.object({
  line1: z.string().trim().min(4, "Enter your house / flat and street").max(120),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  landmark: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.enum(INDIAN_STATES, { message: "Select your state" }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
});

export const checkoutSchema = z.object({
  customer: customerSchema,
  address: addressSchema,
  deliveryMethod: z.enum(["STANDARD", "EXPRESS"]),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
  saveAddress: z.boolean().optional(),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutValues = z.output<typeof checkoutSchema>;

export const trackOrderSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^RB-[A-Z0-9-]{4,20}$/, "Order numbers look like RB-260924-7KQ4M"),
  contact: z.string().trim().min(5, "Enter the email or phone used for the order").max(120),
});
