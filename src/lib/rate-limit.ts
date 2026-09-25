import "server-only";
import { headers } from "next/headers";

/**
 * Fixed-window in-memory rate limiter.
 *
 * Adequate for a single Node instance. On serverless / multi-instance deployments
 * swap the store for Redis (e.g. Upstash) — the call sites stay the same.
 */
type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (store.size > 10_000) {
    for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
  }
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  bucket.count += 1;
  return { ok: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Convenience: rate limit by action name + client IP. */
export async function limitByIp(action: string, limit: number, windowMs: number) {
  return rateLimit(`${action}:${await clientIp()}`, limit, windowMs);
}
