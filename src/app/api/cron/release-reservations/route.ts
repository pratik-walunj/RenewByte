import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/auth/tokens";
import { releaseExpiredReservations } from "@/server/orders";

/** Cancels unpaid online orders older than 30 minutes and frees their stock. Run by Vercel Cron. */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!env.cronSecret || !safeEqual(auth, `Bearer ${env.cronSecret}`)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const released = await releaseExpiredReservations(30);
  return NextResponse.json({ ok: true, released });
}
