import Link from "next/link";
import { ArrowRight, Heart, KeyRound, LifeBuoy, Mail, MapPin, Package, Phone, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { WhatsAppButton } from "@/components/layout/whatsapp";
import { AccountHeading } from "@/components/account/account-heading";
import { SignOutButton } from "@/components/account/account-nav";
import { OrderList, orderListSelect } from "@/components/account/order-list";

export async function generateMetadata() {
  return pageMetadata({ title: "My account", path: "/account", noindex: true });
}

const ACTIVE_STATUSES = ["PAID", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"] as const;

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AccountDashboardPage() {
  const user = await requireUser("/account");
  const [recent, orderCount, activeCount, addressCount, site] = await Promise.all([
    db.order.findMany({
      where: { userId: user.id },
      orderBy: { placedAt: "desc" },
      take: 3,
      select: orderListSelect,
    }),
    db.order.count({ where: { userId: user.id } }),
    db.order.count({ where: { userId: user.id, status: { in: [...ACTIVE_STATUSES] } } }),
    db.address.count({ where: { userId: user.id } }),
    getSiteSettings(),
  ]);

  const firstName = user.name.split(" ")[0] || user.name;
  const stats = [
    { label: "Orders placed", value: orderCount },
    { label: "On the way", value: activeCount },
    { label: "Saved addresses", value: addressCount },
  ];
  const links = [
    { href: "/account/orders", label: "My orders", body: "Track orders and get help", icon: Package },
    { href: "/wishlist", label: "Wishlist", body: "Laptops you've saved", icon: Heart },
    { href: "/account/addresses", label: "Addresses", body: "Manage delivery addresses", icon: MapPin },
    { href: "/account/password", label: "Password & security", body: "Change your password", icon: KeyRound },
    { href: "/track-order", label: "Track an order", body: "Using an order number", icon: Truck },
    { href: "/account/support", label: "Help & support", body: "Warranty, returns and contact", icon: LifeBuoy },
  ];

  return (
    <div className="space-y-10">
      <AccountHeading
        eyebrow="My account"
        title={`${greeting()}, ${firstName}`}
        description="Everything about your orders, addresses and support in one place."
        action={<SignOutButton className="h-9 px-3 lg:hidden" />}
        className="mb-0 sm:mb-0"
      />

      <dl className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-surface">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 px-3 py-4 sm:px-5">
            <dt className="truncate text-[12px] text-muted sm:text-[13px]">{s.label}</dt>
            <dd className="num mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="recent-orders">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="recent-orders" className="text-lg font-semibold tracking-tight">
            Recent orders
          </h2>
          {orderCount > 3 && (
            <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-medium hover:text-accent">
              View all <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
        {recent.length ? (
          <OrderList orders={recent} />
        ) : (
          <EmptyState
            icon={<Package />}
            title="No orders yet"
            description="When you buy a laptop, you'll be able to track it and see its details here."
          >
            <Button asChild>
              <Link href="/laptops">Browse laptops</Link>
            </Button>
          </EmptyState>
        )}
      </section>

      <section aria-labelledby="quick-links">
        <h2 id="quick-links" className="mb-4 text-lg font-semibold tracking-tight">
          Quick links
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {links.map(({ href, label, body, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex h-full items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-subtle">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-[13px] text-muted">{body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="support" className="rounded-xl border border-border bg-stage p-5 sm:p-6">
        <h2 id="support" className="text-lg font-semibold tracking-tight">
          Need a hand?
        </h2>
        <p className="mt-1 text-sm text-muted">
          Our team can help with orders, warranty claims and choosing the right laptop.
          {site.businessHours.length > 0 && " Reach us during business hours:"}
        </p>
        {site.businessHours.length > 0 && (
          <ul className="mt-2 text-[13px] text-muted">
            {site.businessHours.map((h) => (
              <li key={h.days}>
                {h.days}: {h.hours}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <WhatsAppButton location="account-dashboard" className={buttonVariants({ variant: "outline" })} />
          {site.phone && (
            <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className={buttonVariants({ variant: "outline" })}>
              <Phone aria-hidden /> {site.phone}
            </a>
          )}
          {site.email && (
            <a href={`mailto:${site.email}`} className={buttonVariants({ variant: "outline" })}>
              <Mail aria-hidden /> Email us
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
