"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, KeyRound, LayoutDashboard, LifeBuoy, Loader2, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/app/actions/auth";
import { useStore } from "@/components/providers/store-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/password", label: "Password", icon: KeyRound },
  { href: "/account/support", label: "Help & support", icon: LifeBuoy },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
}

/** Desktop sidebar (lg+). */
export function AccountSidebar({ name, email }: { name: string; email: string }) {
  const isActive = useIsActive();
  return (
    <nav aria-label="Account" className="sticky top-28 hidden lg:block">
      <div className="mb-4 rounded-xl border border-border bg-surface p-4">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="truncate text-[13px] text-muted">{email}</p>
      </div>
      <ul className="space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active ? "bg-surface text-foreground shadow-card ring-1 ring-border" : "text-muted hover:bg-subtle hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 border-t border-border pt-4">
        <SignOutButton className="h-10 w-full justify-start px-3" />
      </div>
    </nav>
  );
}

/** Mobile/tablet: horizontally scrollable tabs (< lg). */
export function AccountTabs() {
  const isActive = useIsActive();
  const listRef = React.useRef<HTMLUListElement>(null);
  const pathname = usePathname();

  // Keep the active tab in view after navigation.
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    el?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav aria-label="Account" className="-mx-4 border-b border-border sm:-mx-6 lg:hidden">
      <ul ref={listRef} className="scrollbar-none flex gap-1 overflow-x-auto px-4 sm:px-6">
        {NAV.map(({ href, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center px-3 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { refresh } = useStore();
  const [pending, setPending] = React.useState(false);

  async function onClick() {
    setPending(true);
    try {
      await signOut();
      await refresh();
      toast("You've been signed out");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Couldn't sign out. Please try again.");
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-3 rounded-lg text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-foreground disabled:opacity-60",
        className,
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogOut className="size-4" aria-hidden />}
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
