import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";
import { safeNextPath } from "@/lib/validation/auth";
import { AuthHeading } from "@/components/auth/auth-heading";
import { LoginForm } from "@/components/auth/login-form";

export async function generateMetadata() {
  return pageMetadata({
    title: "Sign in",
    description: "Sign in to your RenewByte account to track orders, manage addresses and check out faster.",
    path: "/login",
    noindex: true,
  });
}

type SearchParams = Promise<{ next?: string | string[] }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next: rawNext } = await searchParams;
  const next = typeof rawNext === "string" ? safeNextPath(rawNext, "") : "";

  const user = await getCurrentUser();
  if (user) redirect(next || (isStaff(user.role) ? "/admin" : "/account"));

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";
  const fromCheckout = next.startsWith("/checkout");

  return (
    <>
      <AuthHeading
        title="Sign in"
        description={
          fromCheckout
            ? "Sign in to use your saved addresses. Your cart comes with you."
            : "Welcome back. Track orders, manage addresses and check out faster."
        }
      />
      <LoginForm next={next || undefined} />
      <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted">
        New to RenewByte?{" "}
        <Link href={registerHref} className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
      {fromCheckout && (
        <p className="mt-3 text-center text-sm">
          <Link href="/checkout" className="text-muted underline-offset-4 hover:text-foreground hover:underline">
            Continue as guest
          </Link>
        </p>
      )}
    </>
  );
}
