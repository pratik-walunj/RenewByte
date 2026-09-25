import { z } from "zod";

/**
 * Shared (client + server) validation for marketing forms. The server actions in
 * src/app/actions/content.ts re-validate with these same schemas.
 */

export const CONTACT_SUBJECTS = [
  "Help choosing a laptop",
  "Order status",
  "Warranty claim",
  "Returns & refunds",
  "Business / bulk order",
  "Something else",
] as const;

const phoneRegex = /^[+\d][\d\s-]{7,16}$/;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(160),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || phoneRegex.test(v), "Please enter a valid phone number."),
  subject: z.enum(CONTACT_SUBJECTS, { message: "Please choose a topic." }),
  message: z.string().trim().min(10, "Please add a little more detail (at least 10 characters).").max(3000),
  /** Honeypot — real users never see or fill this field. */
  website: z.string().max(200),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const TRADE_IN_BRANDS = ["Dell", "HP", "Lenovo", "Apple", "Asus", "Acer", "Microsoft", "Other"] as const;
export const TRADE_IN_CONDITIONS = [
  { value: "like-new", label: "Like new — no visible marks" },
  { value: "good", label: "Good — light scratches, everything works" },
  { value: "fair", label: "Fair — visible wear, everything works" },
  { value: "faulty", label: "Has a fault (screen, battery, keyboard, won't boot…)" },
] as const;
export const RAM_OPTIONS = ["4", "8", "16", "32", "64"] as const;
export const STORAGE_OPTIONS = ["128", "256", "512", "1024", "2048"] as const;
export const AGE_OPTIONS = [
  { value: "1", label: "Under 1 year" },
  { value: "2", label: "1–2 years" },
  { value: "3", label: "2–3 years" },
  { value: "4", label: "3–4 years" },
  { value: "5", label: "4–5 years" },
  { value: "6", label: "More than 5 years" },
] as const;

const optionalChoice = (values: readonly string[]) =>
  z.string().refine((v) => v === "" || values.includes(v), "Please choose an option.");

export const tradeInSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(160),
  phone: z.string().trim().regex(phoneRegex, "Please enter a valid phone number."),
  city: z.string().trim().min(2, "Please enter your city.").max(80),
  brand: z.enum(TRADE_IN_BRANDS, { message: "Please choose a brand." }),
  model: z.string().trim().min(2, "Please enter the model, e.g. Latitude 7490.").max(120),
  processor: z.string().trim().max(80),
  ram: optionalChoice(RAM_OPTIONS),
  storage: optionalChoice(STORAGE_OPTIONS),
  age: optionalChoice(AGE_OPTIONS.map((o) => o.value)),
  condition: z.enum(TRADE_IN_CONDITIONS.map((c) => c.value) as [string, ...string[]], {
    message: "Please describe the condition.",
  }),
  notes: z.string().trim().max(1500),
  website: z.string().max(200),
});
export type TradeInInput = z.infer<typeof tradeInSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(160),
});

export type FormResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
