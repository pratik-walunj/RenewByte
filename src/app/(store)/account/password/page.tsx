import { ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";
import { AccountHeading } from "@/components/account/account-heading";
import { PasswordForm } from "@/components/account/password-form";

export async function generateMetadata() {
  return pageMetadata({ title: "Change password", path: "/account/password", noindex: true });
}

export default async function AccountPasswordPage() {
  const user = await requireUser("/account/password");
  return (
    <>
      <AccountHeading title="Password" description="Choose a strong password you don't use anywhere else." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <PasswordForm email={user.email} />
        </div>
        <aside className="rounded-xl bg-stage p-5 text-sm text-muted">
          <ShieldCheck className="mb-3 size-5 text-foreground" aria-hidden />
          <p className="font-medium text-foreground">Signed in elsewhere?</p>
          <p className="mt-1 leading-relaxed">
            Changing your password signs you out on every other device. You&apos;ll stay signed in here.
          </p>
        </aside>
      </div>
    </>
  );
}
