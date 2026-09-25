import "server-only";
import type { NextRequest } from "next/server";

/**
 * CSRF defence for JSON route handlers: state-changing requests must come from
 * our own origin. (Server Actions get equivalent protection from Next.js.)
 */
export function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Strip control characters and collapse whitespace from free-text user input. */
export function cleanText(value: string, max = 2000) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}
