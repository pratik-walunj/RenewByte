import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";
import { safeNextPath } from "@/lib/validation/auth";
import { AuthHeading } from "@/components/auth/auth-heading";
import { RegisterForm } from "@/components/auth/register-form";

export async function generateMetadata() {
  return pageMetadata({
    title: "Create an account",
    description: "Create a RenewByte account to track orders, save addresses and keep a wishlist.",
    path: "/register",
    noindex: true,
  });
}

type SearchParams = Promise<{ next?: string | string[] }>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const { next: rawNext } = await searchParams;
  const next = typeof rawNext === "string" ? safeNextPath(rawNext, "") : "";

  if (await getCurrentUser()) redirect(next || "/account");

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <>
      <AuthHeading
        title="Create your account"
        description="Track orders, save addresses and keep your wishlist across devices."
      />
      <RegisterForm next={next || undefined} />
      <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
