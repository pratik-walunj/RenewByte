"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ExternalLink,
  FileText,
  Inbox,
  LayoutDashboard,
  Laptop,
  Settings,
  ShoppingBag,
  Star,
  Tags,
  TicketPercent,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Laptop },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/catalog", label: "Brands & categories", icon: Tags },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/inbox", label: "Inbox", icon: Inbox },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

const itemClass =
  "flex min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors [&_svg]:size-4 [&_svg]:shrink-0";

/** Primary admin navigation, shared by the desktop sidebar and the mobile drawer. */
export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      <ul className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = "exact" in item ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  itemClass,
                  active ? "bg-subtle text-foreground" : "text-muted hover:bg-subtle hover:text-foreground",
                )}
              >
                <Icon aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div>
        <p className="eyebrow mb-2 px-3">Shortcuts</p>
        <ul className="flex flex-col gap-0.5">
          <li>
            <Link href="/keystatic" className={cn(itemClass, "text-muted hover:bg-subtle hover:text-foreground")} prefetch={false}>
              <FileText aria-hidden />
              <span className="truncate">Content (CMS)</span>
            </Link>
          </li>
          <li>
            <Link
              href="/"
              target="_blank"
              rel="noopener"
              onClick={onNavigate}
              className={cn(itemClass, "text-muted hover:bg-subtle hover:text-foreground")}
            >
              <ExternalLink aria-hidden />
              <span className="truncate">View storefront</span>
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
