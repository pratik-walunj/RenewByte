import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

/** Keyed hash for storing tokens: a leaked database row cannot be replayed as a cookie. */
export function hashToken(token: string) {
  return createHmac("sha256", env.authSecret).update(token).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
