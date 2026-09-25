"use server";

import { db } from "@/lib/db";
import { limitByIp } from "@/lib/rate-limit";
import { cleanText } from "@/lib/security";
import {
  contactSchema,
  newsletterSchema,
  tradeInSchema,
  type ContactInput,
  type FormResult,
  type TradeInInput,
} from "@/components/forms/schemas";

const HOUR = 60 * 60 * 1000;

function toInt(value: string) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

/** Contact form → ContactMessage (shown in the admin inbox). */
export async function submitContact(input: ContactInput): Promise<FormResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  // Honeypot filled → pretend success so bots learn nothing.
  if (parsed.data.website) return { ok: true };
  if (!(await limitByIp("contact", 5, HOUR)).ok) {
    return { ok: false, error: "You've sent several messages recently. Please try again later or reach us on WhatsApp." };
  }

  const d = parsed.data;
  try {
    await db.contactMessage.create({
      data: {
        name: cleanText(d.name, 80),
        email: d.email,
        phone: d.phone ? cleanText(d.phone, 20) : null,
        subject: d.subject,
        message: cleanText(d.message, 3000),
      },
    });
  } catch (err) {
    console.error("[contact] failed to store message", err);
    return { ok: false, error: "We couldn't send your message right now. Please try again or contact us by phone." };
  }
  return { ok: true };
}

/** Sell / trade-in form → TradeInRequest. */
export async function submitTradeIn(input: TradeInInput): Promise<FormResult> {
  const parsed = tradeInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (parsed.data.website) return { ok: true };
  if (!(await limitByIp("trade-in", 5, HOUR)).ok) {
    return { ok: false, error: "Too many requests. Please try again later." };
  }

  const d = parsed.data;
  try {
    await db.tradeInRequest.create({
      data: {
        name: cleanText(d.name, 80),
        email: d.email,
        phone: cleanText(d.phone, 20),
        city: cleanText(d.city, 80),
        brand: d.brand,
        model: cleanText(d.model, 120),
        processor: d.processor ? cleanText(d.processor, 80) : null,
        ramGb: toInt(d.ram),
        storageGb: toInt(d.storage),
        ageYears: toInt(d.age),
        condition: d.condition,
        notes: d.notes ? cleanText(d.notes, 1500) : null,
      },
    });
  } catch (err) {
    console.error("[trade-in] failed to store request", err);
    return { ok: false, error: "We couldn't submit your request right now. Please try again shortly." };
  }
  return { ok: true };
}

/** Newsletter sign-up. Idempotent: subscribing twice is not an error. */
export async function subscribeNewsletter(input: { email: string }): Promise<FormResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please enter a valid email address.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!(await limitByIp("newsletter", 5, HOUR)).ok) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }
  try {
    await db.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      create: { email: parsed.data.email },
      update: {},
    });
  } catch (err) {
    console.error("[newsletter] failed to subscribe", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  return { ok: true };
}
