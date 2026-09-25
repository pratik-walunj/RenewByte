import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";
import { pageMetadata } from "@/lib/seo";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";

export async function generateMetadata() {
  return pageMetadata({
    title: "Choose a new password",
    description: "Set a new password for your RenewByte account.",
    path: "/reset-password",
    noindex: true,
  });
}

type SearchParams = Promise<{ token?: string | string[] }>;

/** Look the token up up-front so an expired link shows a helpful state instead of a form that will fail. */
async function checkToken(token: string) {
  if (token.length < 20 || token.length > 200) return null;
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true, usedAt: true, user: { select: { email: true, isActive: true } } },
  });
  if (!record || record.usedAt || record.expiresAt < new Date() || !record.user.isActive) return null;
  return { email: record.user.email };
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const { token: raw } = await searchParams;
  const token = typeof raw === "string" ? raw : "";
  const valid = token ? await checkToken(token) : null;

  if (!valid) {
    return (
      <div className="flex flex-col items-start">
        <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-warning-soft text-warning">
          <LinkIcon className="size-5" aria-hidden />
        </span>
        <AuthHeading
          title="This link has expired"
          description="Password reset links work once and expire after an hour. Request a new one and we'll email it right away."
        />
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/forgot-password">Send a new link</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthHeading
        title="Choose a new password"
        description={
          <>
            For <span className="font-medium text-foreground">{valid.email}</span>. You&apos;ll be signed out on other
            devices.
          </>
        }
      />
      <ResetPasswordForm token={token} email={valid.email} />
    </>
  );
}
