import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/session";
import KeystaticApp from "./keystatic";

export const metadata: Metadata = { title: "Content (CMS)", robots: { index: false, follow: false } };

/** Keystatic admin UI — staff only. */
export default async function KeystaticLayout() {
  await requireStaff();
  return <KeystaticApp />;
}
