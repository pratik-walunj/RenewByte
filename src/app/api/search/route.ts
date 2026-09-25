import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { searchSuggestions } from "@/server/catalog";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`search:${ip}`, 120, 60_000).ok) {
    return NextResponse.json({ products: [], brands: [], categories: [] }, { status: 429 });
  }
  const results = await searchSuggestions(q);
  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" },
  });
}
