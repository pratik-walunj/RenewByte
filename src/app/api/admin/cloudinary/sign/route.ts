import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { getStaffUser } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Signs a direct browser → Cloudinary upload. Only the parameters signed here
 * (folder + timestamp) are accepted by Cloudinary, and the API secret never
 * leaves the server.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await getStaffUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!env.cloudinary.configured) {
    return NextResponse.json({ error: "Image uploads are not configured." }, { status: 503 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = { folder: env.cloudinary.folder, timestamp };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = createHash("sha1").update(`${toSign}${env.cloudinary.apiSecret}`).digest("hex");

  return NextResponse.json(
    {
      timestamp,
      signature,
      apiKey: env.cloudinary.apiKey,
      cloudName: env.cloudinary.cloudName,
      folder: env.cloudinary.folder,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
