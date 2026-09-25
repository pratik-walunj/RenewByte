import { z } from "zod";
import { addressSchema } from "@/lib/validation/checkout";

export const PASSWORD_MIN = 10;
export const MAX_ADDRESSES = 10;

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(120);

/** New passwords: length is what matters most; no composition rules. */
const newPassword = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
  .max(128, "Use 128 characters or fewer");

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?91(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"));

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v.replace(/[\s-]/g, "").replace(/^\+?91(?=\d{10}$)/, "") : ""))
  .pipe(z.union([z.literal(""), z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")]));

const name = z.string().trim().min(2, "Enter your full name").max(80);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(128),
});

export const registerSchema = z.object({
  name,
  email,
  password: newPassword,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name,
  phone: optionalPhone,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(128),
    newPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "Choose a password different from your current one",
    path: ["newPassword"],
  });

export const accountAddressSchema = addressSchema.extend({
  label: z.string().trim().max(30).optional().or(z.literal("")),
  fullName: name,
  phone,
  isDefault: z.boolean().optional(),
});

export type LoginInput = z.input<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type ProfileInput = z.input<typeof profileSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type AccountAddressInput = z.input<typeof accountAddressSchema>;

/**
 * Only allow same-site relative redirects ("/account", "/checkout?x=1").
 * Rejects absolute URLs, protocol-relative ("//evil.com") and backslash tricks.
 */
export function safeNextPath(next: unknown, fallback = "/account") {
  if (typeof next !== "string" || next.length > 512) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  if (/[\u0000-\u001F\u007F]/.test(next)) return fallback;
  if (/^\/(login|register|forgot-password|reset-password)(\/|\?|$)/.test(next)) return fallback;
  return next;
}
