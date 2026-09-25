"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorize, failure } from "@/server/admin/guard";
import type { ActionResult } from "@/server/admin/types";

const idSchema = z.string().min(1).max(64);
const ROLE_LABEL = { CUSTOMER: "customer", STAFF: "staff", ADMIN: "admin" } as const;

/** ADMIN only. Admins can never change their own role (prevents locking everyone out). */
export async function setUserRole(userId: string, role: string): Promise<ActionResult> {
  const { user, denied } = await authorize("ADMIN");
  if (!user) return denied;
  const parsed = z.object({ userId: idSchema, role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]) }).safeParse({ userId, role });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  if (parsed.data.userId === user.id) return { ok: false, error: "You can't change your own role." };

  try {
    const target = await db.user.update({ where: { id: userId }, data: { role: parsed.data.role }, select: { name: true } });
    // Force a fresh sign-in so the new permissions apply everywhere immediately.
    await db.session.deleteMany({ where: { userId } });
    revalidatePath(`/admin/customers/${userId}`);
    return { ok: true, message: `${target.name}'s role changed to ${ROLE_LABEL[parsed.data.role]}` };
  } catch (e) {
    return failure("setUserRole", e);
  }
}

/** ADMIN only. Deactivated users are signed out and can't sign in. */
export async function setUserActive(userId: string, active: boolean): Promise<ActionResult> {
  const { user, denied } = await authorize("ADMIN");
  if (!user) return denied;
  const parsed = z.object({ userId: idSchema, active: z.boolean() }).safeParse({ userId, active });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  if (userId === user.id) return { ok: false, error: "You can't deactivate your own account." };

  try {
    await db.user.update({ where: { id: userId }, data: { isActive: active } });
    if (!active) await db.session.deleteMany({ where: { userId } });
    revalidatePath(`/admin/customers/${userId}`);
    return { ok: true, message: active ? "Account activated" : "Account deactivated and signed out" };
  } catch (e) {
    return failure("setUserActive", e);
  }
}
