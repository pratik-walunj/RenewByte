"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorize, failure } from "@/server/admin/guard";
import type { ActionResult } from "@/server/admin/types";

const schema = z.object({
  kind: z.enum(["contact", "tradein"]),
  id: z.string().min(1).max(64),
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]),
});

export async function setInboxStatus(kind: string, id: string, status: string): Promise<ActionResult> {
  const { user, denied } = await authorize();
  if (!user) return denied;
  const parsed = schema.safeParse({ kind, id, status });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  try {
    if (parsed.data.kind === "contact") {
      await db.contactMessage.update({ where: { id }, data: { status: parsed.data.status } });
    } else {
      await db.tradeInRequest.update({ where: { id }, data: { status: parsed.data.status } });
    }
    revalidatePath("/admin/inbox");
    const label = { NEW: "new", IN_PROGRESS: "in progress", RESOLVED: "resolved" }[parsed.data.status];
    return { ok: true, message: `Marked as ${label}` };
  } catch (e) {
    return failure("setInboxStatus", e);
  }
}

/** ADMIN only: remove a newsletter subscriber (e.g. an unsubscribe request by email). */
export async function deleteSubscriber(id: string): Promise<ActionResult> {
  const { user, denied } = await authorize("ADMIN");
  if (!user) return denied;
  if (!z.string().min(1).max(64).safeParse(id).success) return { ok: false, error: "Invalid request." };
  try {
    await db.newsletterSubscriber.delete({ where: { id } });
    revalidatePath("/admin/inbox");
    return { ok: true, message: "Subscriber removed" };
  } catch (e) {
    return failure("deleteSubscriber", e);
  }
}
