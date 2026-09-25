import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export async function generateMetadata() {
  return pageMetadata({
    title: "Forgot password",
    description: "Reset the password for your RenewByte account.",
    path: "/forgot-password",
    noindex: true,
  });
}

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        title="Reset your password"
        description="Enter the email you signed up with and we'll send you a link to choose a new password."
      />
      <ForgotPasswordForm />
      <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
