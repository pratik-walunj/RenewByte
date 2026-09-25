import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { SiteSettings } from "@/lib/cms";
import { digitsOnly, whatsappLink } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";

type Column = { title: string; links: readonly { label: string; href: string }[] };

function SocialIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    instagram:
      "M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Zm6.1-8.1a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 3.6c2.7 0 3 0 4.1.1 2.7.1 4 1.4 4.1 4.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 2.7-1.4 4-4.1 4.1-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-2.7-.1-4-1.4-4.1-4.1C3.7 15 3.6 14.7 3.6 12s0-3 .1-4.1c.1-2.7 1.4-4 4.1-4.1C9 3.6 9.3 3.6 12 3.6Z",
    facebook: "M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z",
    youtube:
      "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z",
    x: "M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.5l11.2 14.5Z",
    linkedin:
      "M6.9 8.8H3.5V20h3.4V8.8ZM5.2 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM20.5 13.6c0-3-.6-5.1-4.1-5.1-1.7 0-2.8.9-3.2 1.8V8.8H9.9V20h3.4v-5.5c0-1.5.3-2.9 2.1-2.9 1.8 0 1.8 1.7 1.8 3V20h3.4v-6.4Z",
  };
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path d={paths[name]} fill="currentColor" />
    </svg>
  );
}

export function SiteFooter({
  settings,
  about,
  columns,
  paymentNote,
  bottomNote,
}: {
  settings: SiteSettings;
  about: string;
  columns: readonly Column[];
  paymentNote: string;
  bottomNote: string;
}) {
  const socials = Object.entries(settings.social).filter(([, url]) => !!url) as [string, string][];
  const address = [settings.address.line1, settings.address.line2, settings.address.city, settings.address.state, settings.address.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <footer className="mt-20 bg-[#0b1120] text-slate-300">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2.7fr]">
          <div className="max-w-sm">
            <Logo name={settings.businessName} inverted />
            <p className="mt-4 text-sm leading-relaxed text-slate-400">{about}</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {settings.phone && (
                <li>
                  <a href={`tel:+${digitsOnly(settings.phone)}`} className="inline-flex items-center gap-2.5 hover:text-white">
                    <Phone className="size-4 text-slate-500" aria-hidden /> {settings.phone}
                  </a>
                </li>
              )}
              {settings.whatsappNumber && (
                <li>
                  <a
                    href={whatsappLink(settings.whatsappNumber, settings.whatsappMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 hover:text-white"
                  >
                    <MessageCircle className="size-4 text-slate-500" aria-hidden /> WhatsApp us
                  </a>
                </li>
              )}
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2.5 hover:text-white">
                    <Mail className="size-4 text-slate-500" aria-hidden /> {settings.email}
                  </a>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden /> <span>{address}</span>
                </li>
              )}
            </ul>
            {socials.length > 0 && (
              <ul className="mt-6 flex gap-2" aria-label="Social media">
                {socials.map(([name, url]) => (
                  <li key={name}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={name === "x" ? "X (Twitter)" : name[0].toUpperCase() + name.slice(1)}
                      className="flex size-9 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-colors hover:border-white/30 hover:text-white"
                    >
                      <SocialIcon name={name} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h2 className="text-[13px] font-semibold tracking-wide text-white">{col.title}</h2>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="text-slate-400 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.legalName}. All rights reserved.
            {settings.gstin && <span className="ml-2">GSTIN {settings.gstin}</span>}
          </p>
          {paymentNote && <p>{paymentNote}</p>}
        </div>
        {bottomNote && <p className="container-page pb-6 text-[11.5px] leading-relaxed text-slate-600">{bottomNote}</p>}
      </div>
    </footer>
  );
}
