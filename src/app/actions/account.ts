"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { destroyOtherSessions, getCurrentUser } from "@/lib/auth/session";
import { limitByIp } from "@/lib/rate-limit";
import { cleanText } from "@/lib/security";
import {
  accountAddressSchema,
  changePasswordSchema,
  MAX_ADDRESSES,
  profileSchema,
  type AccountAddressInput,
  type ChangePasswordInput,
  type ProfileInput,
} from "@/lib/validation/auth";

type FieldErrors = Record<string, string[] | undefined>;
export type AccountResult = { ok: true; message: string } | { ok: false; error: string; fieldErrors?: FieldErrors };

const SIGNED_OUT: AccountResult = { ok: false, error: "Your session has expired. Please sign in again." };
const idSchema = z.string().min(1).max(64);

export async function updateProfile(input: ProfileInput): Promise<AccountResult> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await db.user.update({
    where: { id: user.id },
    data: { name: cleanText(parsed.data.name, 80), phone: parsed.data.phone || null },
  });
  revalidatePath("/account", "layout");
  return { ok: true, message: "Profile updated" };
}

export async function changePassword(input: ChangePasswordInput): Promise<AccountResult> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!(await limitByIp("change-password", 10, 15 * 60_000)).ok) {
    return { ok: false, error: "Too many attempts. Please wait 15 minutes and try again." };
  }
  const record = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !(await verifyPassword(parsed.data.currentPassword, record.passwordHash))) {
    return {
      ok: false,
      error: "Your current password is incorrect.",
      fieldErrors: { currentPassword: ["Your current password is incorrect."] },
    };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
  await destroyOtherSessions(user.id);
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}

function addressData(values: z.output<typeof accountAddressSchema>) {
  return {
    label: values.label ? cleanText(values.label, 30) : null,
    fullName: cleanText(values.fullName, 80),
    phone: values.phone,
    line1: cleanText(values.line1, 120),
    line2: values.line2 ? cleanText(values.line2, 120) : null,
    landmark: values.landmark ? cleanText(values.landmark, 80) : null,
    city: cleanText(values.city, 60),
    state: values.state,
    pincode: values.pincode,
  };
}

/** Create (no id) or update (id) one of the signed-in user's addresses. */
export async function saveAddress(input: AccountAddressInput, id?: string | null): Promise<AccountResult> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const parsed = accountAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!(await limitByIp("address", 30, 10 * 60_000)).ok) {
    return { ok: false, error: "Too many changes. Please wait a few minutes." };
  }
  const data = addressData(parsed.data);

  if (id) {
    if (!idSchema.safeParse(id).success) return { ok: false, error: "Address not found." };
    const existing = await db.address.findFirst({ where: { id, userId: user.id }, select: { id: true } });
    if (!existing) return { ok: false, error: "Address not found." };
    await db.$transaction(async (tx) => {
      if (parsed.data.isDefault) {
        await tx.address.updateMany({ where: { userId: user.id, NOT: { id } }, data: { isDefault: false } });
      }
      await tx.address.update({
        where: { id },
        data: { ...data, ...(parsed.data.isDefault ? { isDefault: true } : {}) },
      });
    });
  } else {
    const count = await db.address.count({ where: { userId: user.id } });
    if (count >= MAX_ADDRESSES) {
      return { ok: false, error: `You can save up to ${MAX_ADDRESSES} addresses. Remove one to add another.` };
    }
    const makeDefault = count === 0 || Boolean(parsed.data.isDefault);
    await db.$transaction(async (tx) => {
      if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      await tx.address.create({ data: { ...data, userId: user.id, isDefault: makeDefault } });
    });
  }
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address saved" };
}

export async function deleteAddress(id: string): Promise<AccountResult> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Address not found." };
  const existing = await db.address.findFirst({ where: { id, userId: user.id }, select: { isDefault: true } });
  if (!existing) return { ok: false, error: "Address not found." };
  await db.$transaction(async (tx) => {
    await tx.address.delete({ where: { id } });
    if (existing.isDefault) {
      // Promote the most recent remaining address so there's always a default.
      const next = await tx.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address removed" };
}

export async function setDefaultAddress(id: string): Promise<AccountResult> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Address not found." };
  const existing = await db.address.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!existing) return { ok: false, error: "Address not found." };
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id, NOT: { id } }, data: { isDefault: false } }),
    db.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/addresses");
  return { ok: true, message: "Default address updated" };
}
