"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyOtherSessions, destroySession, isStaff } from "@/lib/auth/session";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { limitByIp } from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  safeNextPath,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/lib/validation/auth";
import { cleanText } from "@/lib/security";
import { mergeGuestCartInto } from "@/server/cart";
import { sendEmail } from "@/server/email";

type FieldErrors = Record<string, string[] | undefined>;
export type AuthResult = { ok: true; redirectTo: string } | { ok: false; error: string; fieldErrors?: FieldErrors };
export type SimpleResult = { ok: true; message: string } | { ok: false; error: string; fieldErrors?: FieldErrors };

const INVALID_CREDENTIALS = "Invalid email or password.";
const RESET_TTL_MS = 60 * 60 * 1000;

/**
 * A real scrypt hash of a random string, used so that a login for an unknown
 * email costs the same time as one for a real account.
 */
let dummyHash: Promise<string> | null = null;
function getDummyHash() {
  dummyHash ??= hashPassword(generateToken(16));
  return dummyHash;
}

async function signIn(userId: string) {
  await createSession(userId);
  try {
    await mergeGuestCartInto(userId);
  } catch (err) {
    // A failed merge must never block sign-in.
    console.error("[auth] guest cart merge failed", err);
  }
}

export async function login(input: LoginInput, next?: string | null): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!(await limitByIp("login", 10, 15 * 60_000)).ok) {
    return { ok: false, error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, isActive: true, role: true },
  });
  const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid || !user.isActive) return { ok: false, error: INVALID_CREDENTIALS };

  await signIn(user.id);
  const fallback = isStaff(user.role) ? "/admin" : "/account";
  return { ok: true, redirectTo: safeNextPath(next, fallback) };
}

export async function register(input: RegisterInput, next?: string | null): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!(await limitByIp("register", 5, 60 * 60_000)).ok) {
    return { ok: false, error: "Too many sign-up attempts. Please try again later." };
  }

  const { email, password } = parsed.data;
  const name = cleanText(parsed.data.name, 80);
  const taken = await db.user.findUnique({ where: { email }, select: { id: true } });
  // Deliberately vague: we don't confirm whether an email is registered.
  const unavailable = {
    ok: false as const,
    error: "We couldn't create an account with these details. If you already have one, sign in or reset your password.",
  };
  if (taken) return unavailable;

  let userId: string;
  try {
    const user = await db.user.create({
      data: { email, name, passwordHash: await hashPassword(password) },
      select: { id: true },
    });
    userId = user.id;
  } catch (err) {
    // Unique violation from a concurrent sign-up with the same email.
    if ((err as { code?: string }).code === "P2002") return unavailable;
    console.error("[auth] register failed", err);
    return { ok: false, error: "We couldn't create your account. Please try again." };
  }

  await signIn(userId);
  return { ok: true, redirectTo: safeNextPath(next, "/account") };
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<SimpleResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!(await limitByIp("forgot-password", 5, 60 * 60_000)).ok) {
    return { ok: false, error: "Too many requests. Please try again in an hour." };
  }

  const success = {
    ok: true as const,
    message: "If an account exists for that email, we've sent a link to reset your password. It expires in 1 hour.",
  };

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true, isActive: true },
  });
  if (!user || !user.isActive) return success;

  const token = generateToken();
  await db.$transaction([
    // Only the newest link works.
    db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    }),
  ]);

  const url = `${env.siteUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const firstName = user.name.split(" ")[0] || "there";
  const safeName = firstName.replace(/[&<>"']/g, "");
  await sendEmail({
    to: user.email,
    subject: "Reset your RenewByte password",
    text: [
      `Hi ${firstName},`,
      "",
      "We received a request to reset the password for your RenewByte account.",
      `Reset it here (link valid for 1 hour): ${url}`,
      "",
      "If you didn't ask for this, you can ignore this email — your password won't change.",
    ].join("\n"),
    html: `
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111827;max-width:560px">
    <h1 style="font-size:20px">Reset your password</h1>
    <p>Hi ${safeName}, we received a request to reset the password for your RenewByte account.</p>
    <p><a href="${url}" style="background:#111827;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Choose a new password</a></p>
    <p style="color:#64748b;font-size:14px">This link expires in 1 hour. If you didn't ask for this, you can ignore this email — your password won't change.</p>
  </div>`,
  });

  return success;
}

export async function resetPassword(input: ResetPasswordInput): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!(await limitByIp("reset-password", 10, 15 * 60_000)).ok) {
    return { ok: false, error: "Too many attempts. Please wait a few minutes." };
  }

  const expired = {
    ok: false as const,
    error: "This reset link is invalid or has expired. Please request a new one.",
  };
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true, user: { select: { isActive: true } } },
  });
  if (!record || record.usedAt || record.expiresAt < new Date() || !record.user.isActive) return expired;

  const passwordHash = await hashPassword(parsed.data.password);
  // Mark used atomically so a link can't be replayed by a concurrent request.
  const claimed = await db.passwordResetToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) return expired;

  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  await destroyOtherSessions(record.userId);
  await signIn(record.userId);
  return { ok: true, redirectTo: "/account" };
}

/**
 * Ends the current session. The client refreshes the store and navigates home
 * afterwards; for no-JS form posts (`<form action={signOutAndRedirect}>`) use the redirecting variant.
 */
export async function signOut(): Promise<{ ok: true }> {
  await destroySession();
  return { ok: true };
}

export async function signOutAndRedirect() {
  await destroySession();
  redirect("/");
}
