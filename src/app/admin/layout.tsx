import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import { requireStaff } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/shell/nav";
import { AdminMobileNav } from "@/components/admin/shell/mobile-nav";
import { AdminUserCard } from "@/components/admin/shell/user-menu";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · RenewByte Admin" },
  robots: { index: false, follow: false },
};

function BrandMark() {
  return (
    <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#111827" />
        <path
          d="M10 20.5V11.5h6.2a3.6 3.6 0 0 1 0 7.2H13l5.4 5.3"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="23" cy="10" r="2.2" fill="#2563eb" />
      </svg>
      <span className="truncate text-[15px] font-semibold tracking-tight">
        RenewByte <span className="font-normal text-muted">Admin</span>
      </span>
    </Link>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const userCard = <AdminUserCard name={user.name} email={user.email} role={user.role} />;

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#admin-main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <BrandMark />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          <AdminNav />
        </div>
        <div className="border-t border-border p-4">{userCard}</div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface/95 px-3 backdrop-blur lg:hidden">
        <AdminMobileNav footer={userCard} />
        <BrandMark />
      </header>

      <main id="admin-main" className="min-w-0 lg:pl-64">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>
      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{ classNames: { toast: "!rounded-xl !border-border !shadow-pop !font-sans" } }}
      />
    </div>
  );
}
