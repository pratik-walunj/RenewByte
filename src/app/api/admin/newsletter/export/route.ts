import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStaffUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Neutralise spreadsheet formula injection and quote every CSV field. */
function csvField(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Staff-only CSV export of newsletter subscribers. */
export async function GET() {
  const user = await getStaffUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const rows = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "asc" }, select: { email: true, createdAt: true } });
  const lines = ["email,subscribed_at", ...rows.map((r) => `${csvField(r.email)},${csvField(r.createdAt.toISOString())}`)];
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="renewbyte-subscribers-${date}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
