import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "rb_session";

/**
 * Optimistic gate for private areas: bounce visitors without a session cookie
 * before rendering. Real authorisation (session validity + role) is enforced
 * server-side in each layout, page, server action and route handler.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSession = req.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    if (pathname.startsWith("/api/keystatic") || pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/keystatic/:path*", "/api/keystatic/:path*", "/api/admin/:path*"],
};
