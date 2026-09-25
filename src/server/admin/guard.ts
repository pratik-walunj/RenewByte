import "server-only";
import type { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { getStaffUser, type SessionUser } from "@/lib/auth/session";
import type { ActionFailure, FieldErrors } from "@/server/admin/types";

type Denied = { ok: false; error: string };

/**
 * Authorisation for admin server actions and route handlers. Every mutation calls
 * this itself — the admin layout's redirect is never relied upon.
 */
export async function authorize(
  role: "STAFF" | "ADMIN" = "STAFF",
): Promise<{ user: SessionUser; denied: null } | { user: null; denied: Denied }> {
  const user = await getStaffUser();
  if (!user) return { user: null, denied: { ok: false, error: "Your session has expired. Please sign in again." } };
  if (role === "ADMIN" && user.role !== "ADMIN") {
    return { user: null, denied: { ok: false, error: "Only administrators can do this." } };
  }
  return { user, denied: null };
}

export function invalid(error: z.ZodError, message = "Please fix the highlighted fields."): ActionFailure {
  return { ok: false, error: message, fieldErrors: error.flatten().fieldErrors as FieldErrors };
}

/** True when `e` is a unique-constraint violation, optionally on a specific column. */
export function isUniqueViolation(e: unknown, field?: string) {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return false;
  if (!field) return true;
  // Prisma 7 driver adapters report the columns in different places; search the whole meta payload.
  return JSON.stringify(e.meta ?? {}).includes(field);
}

export function isForeignKeyViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2003" || e.code === "P2014");
}

export function isNotFound(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025";
}

/** Log unexpected failures server-side and return a generic message to the client. */
export function failure(scope: string, e: unknown, message = "Something went wrong. Please try again."): Denied {
  console.error(`[admin:${scope}]`, e);
  return { ok: false, error: message };
}
