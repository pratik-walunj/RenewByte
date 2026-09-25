import { makeRouteHandler } from "@keystatic/next/route-handler";
import { NextResponse } from "next/server";
import config from "@/keystatic.config";
import { getStaffUser } from "@/lib/auth/session";

const handler = makeRouteHandler({ config });

/**
 * Keystatic API. In `local` mode this writes content files to disk, so it is
 * restricted to signed-in staff. (In `github` mode Keystatic additionally
 * requires GitHub authentication for every write.)
 */
async function guard(req: Request, fn: (r: Request) => Promise<Response>) {
  const isGithubOAuthCallback = new URL(req.url).pathname.startsWith("/api/keystatic/github/");
  if (!isGithubOAuthCallback && !(await getStaffUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return fn(req);
}

export function GET(req: Request) {
  return guard(req, handler.GET);
}

export function POST(req: Request) {
  return guard(req, handler.POST);
}
