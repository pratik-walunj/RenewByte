"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { cleanText } from "@/lib/security";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { allowedNextStatuses, updateOrderStatus } from "@/server/orders";
import { authorize, failure, invalid } from "@/server/admin/guard";
import { orderStatusSchema } from "@/server/admin/schemas/order";
import type { ActionResult } from "@/server/admin/types";

export async function changeOrderStatus(input: unknown): Promise<ActionResult> {
  const { user, denied } = await authorize();
  if (!user) return denied;
  const parsed = orderStatusSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const order = await db.order.findUnique({ where: { id: v.orderId }, select: { status: true } });
  if (!order) return { ok: false, error: "This order no longer exists." };
  const sameStatus = v.status === order.status;
  if (!sameStatus && !allowedNextStatuses(order.status).includes(v.status)) {
    return {
      ok: false,
      error: `An order that is ${ORDER_STATUS_LABEL[order.status].toLowerCase()} can't move to ${ORDER_STATUS_LABEL[v.status].toLowerCase()}.`,
      fieldErrors: { status: ["Not allowed from the current status."] },
    };
  }
  if (sameStatus && !v.note && !v.courier && !v.trackingNumber) {
    return { ok: false, error: "Choose a new status or add a note or tracking details." };
  }

  try {
    await updateOrderStatus({
      orderId: v.orderId,
      status: v.status,
      note: v.note ? cleanText(v.note, 500) : undefined,
      courier: v.courier || undefined,
      trackingNumber: v.trackingNumber || undefined,
      userId: user.id,
    });
  } catch (e) {
    return failure("changeOrderStatus", e, "The order couldn't be updated. It may have changed — reload and try again.");
  }
  revalidatePath(`/admin/orders/${v.orderId}`);
  return { ok: true, message: sameStatus ? "Order updated" : `Marked as ${ORDER_STATUS_LABEL[v.status].toLowerCase()}` };
}
