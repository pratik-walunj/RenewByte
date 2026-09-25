import Link from "next/link";
import { ChevronRight, CircleHelp, Mail, MessageSquareText, Phone, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";
import { whatsappLink } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/layout/whatsapp";
import { AccountHeading } from "@/components/account/account-heading";

export async function generateMetadata() {
  return pageMetadata({ title: "Help & support", path: "/account/support", noindex: true });
}

export default async function AccountSupportPage() {
  const user = await requireUser("/account/support");
  const site = await getSiteSettings();

  const contacts = [
    site.whatsappNumber && {
      href: whatsappLink(site.whatsappNumber, `Hi, this is ${user.name} (${user.email}). I need some help.`),
      label: "WhatsApp",
      detail: "Usually the quickest way to reach us",
      icon: <WhatsAppIcon className="size-5 text-[#1da851]" />,
      external: true,
    },
    site.phone && {
      href: `tel:${site.phone.replace(/[^\d+]/g, "")}`,
      label: "Call us",
      detail: site.phone,
      icon: <Phone className="size-5" aria-hidden />,
      external: false,
    },
    site.email && {
      href: `mailto:${site.email}`,
      label: "Email",
      detail: site.email,
      icon: <Mail className="size-5" aria-hidden />,
      external: false,
    },
    {
      href: "/contact",
      label: "Contact form",
      detail: "Send us a message and we'll reply by email",
      icon: <MessageSquareText className="size-5" aria-hidden />,
      external: false,
    },
  ].filter(Boolean) as { href: string; label: string; detail: string; icon: React.ReactNode; external: boolean }[];

  const topics = [
    { href: "/track-order", label: "Track an order", body: "Live status for any order number", icon: Truck },
    { href: "/warranty", label: "Warranty", body: "What's covered and how to claim", icon: ShieldCheck },
    { href: "/returns", label: "Returns & refunds", body: "Return window and refund timelines", icon: RotateCcw },
    { href: "/faq", label: "FAQs", body: "Answers to common questions", icon: CircleHelp },
  ];

  return (
    <>
      <AccountHeading
        title="Help & support"
        description="Questions about an order, a warranty claim or choosing a laptop? We're here to help."
      />

      <section aria-labelledby="contact-heading" className="mb-10">
        <h2 id="contact-heading" className="mb-4 text-lg font-semibold tracking-tight">
          Contact us
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {contacts.map((c) => (
            <li key={c.label}>
              <a
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex h-full items-center gap-3.5 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-subtle">{c.icon}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{c.label}</span>
                  <span className="block truncate text-[13px] text-muted">{c.detail}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        {site.businessHours.length > 0 && (
          <div className="mt-4 rounded-xl bg-stage px-4 py-3 text-sm">
            <p className="eyebrow mb-1.5">Support hours</p>
            <ul className="space-y-0.5 text-muted">
              {site.businessHours.map((h) => (
                <li key={h.days} className="flex flex-wrap justify-between gap-x-4">
                  <span>{h.days}</span>
                  <span className="num">{h.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-4 text-[13px] text-muted">
          Tip: include your order number (it starts with <span className="font-mono">RB-</span>) so we can help faster.
        </p>
      </section>

      <section aria-labelledby="topics-heading">
        <h2 id="topics-heading" className="mb-4 text-lg font-semibold tracking-tight">
          Self-service
        </h2>
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {topics.map(({ href, label, body, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-subtle/60">
                <Icon className="size-5 shrink-0 text-muted" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-[13px] text-muted">{body}</span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
