"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache";
import { INDIAN_STATES } from "@/lib/constants";
import { rupeesToPaise } from "@/lib/format";
import { cleanText } from "@/lib/security";
import { authorize, failure, invalid } from "@/server/admin/guard";
import { parsePrefixes, shippingZoneSchema, storeSettingsSchema } from "@/server/admin/schemas/settings";
import type { ActionResult } from "@/server/admin/types";

const idSchema = z.string().min(1).max(64);

function expireSettings() {
  revalidateTag(TAGS.settings, { expire: 0 });
  revalidatePath("/admin/settings");
}

/** ADMIN only. */
export async function saveStoreSettings(input: unknown): Promise<ActionResult> {
  const { user, denied } = await authorize("ADMIN");
  if (!user) return denied;
  const parsed = storeSettingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const data = {
    taxRateBps: Math.round(v.taxRatePercent * 100),
    pricesIncludeTax: v.pricesIncludeTax,
    freeShippingThreshold: rupeesToPaise(v.freeShippingThresholdRupees),
    flatShippingFee: rupeesToPaise(v.flatShippingFeeRupees),
    expressEnabled: v.expressEnabled,
    expressShippingFee: rupeesToPaise(v.expressShippingFeeRupees),
    codEnabled: v.codEnabled,
    codFee: rupeesToPaise(v.codFeeRupees),
    codMaxOrderValue: v.codMaxOrderRupees === null ? null : rupeesToPaise(v.codMaxOrderRupees),
    razorpayEnabled: v.razorpayEnabled,
    lowStockThreshold: v.lowStockThreshold,
  };
  try {
    await db.storeSettings.upsert({ where: { id: "default" }, create: { id: "default", ...data }, update: data });
    expireSettings();
    return { ok: true, message: "Store settings saved" };
  } catch (e) {
    return failure("saveStoreSettings", e);
  }
}

/** ADMIN only. */
export async function saveShippingZone(id: string | null, input: unknown): Promise<ActionResult> {
  const { user, denied } = await authorize("ADMIN");
  if (!user) return denied;
  if (id !== null && !idSchema.safeParse(id).success) return { ok: false, error: "Invalid request." };
  const parsed = shippingZoneSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const allowed = new Set<string>(INDIAN_STATES);
  const data = {
    name: cleanText(v.name, 80),
    states: [...new Set(v.states)].filter((s) => allowed.has(s)),
    pincodePrefixes: parsePrefixes(v.pincodePrefixes),
    fee: rupeesToPaise(v.feeRupees),
    expressFee: v.expressFeeRupees === null ? null : rupeesToPaise(v.expressFeeRupees),
    minDays: v.minDays,
    maxDays: v.maxDays,
    isActive: v.isActive,
    sortOrder: v.sortOrder,
  };
  try {
    if (id) await db.shippingZone.update({ where: { id }, data });
    else await db.shippingZone.create({ data });
    expireSettings();
    return { ok: true, message: id ? "Shipping zone saved" : "Shipping zone created" };
  } catch (e) {
    return failure("saveShippingZone", e);
  }
}

/** ADMIN only. */
export async function deleteShippingZone(id: string): Promise<ActionResult> {
  const { user, denied } = await authorize("ADMIN");
  if (!user) return denied;
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid request." };
  try {
    await db.shippingZone.delete({ where: { id } });
    expireSettings();
    return { ok: true, message: "Shipping zone deleted" };
  } catch (e) {
    return failure("deleteShippingZone", e);
  }
}
