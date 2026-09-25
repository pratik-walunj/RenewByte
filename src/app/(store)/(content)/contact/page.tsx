import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl, cn, digitsOnly } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-shell";
import { WhatsAppButton, WhatsAppIcon } from "@/components/layout/whatsapp";
import { JsonLd } from "@/components/seo/json-ld";
import { ContactForm } from "@/components/forms/contact-form";

export function generateMetadata() {
  return pageMetadata({
    title: "Contact Us",
    description:
      "Questions about a refurbished laptop, your order, warranty or returns? Call, WhatsApp or email the RenewByte team, or send us a message.",
    path: "/contact",
  });
}

function isMapsEmbed(url: string | null): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "www.google.com" && u.pathname.startsWith("/maps/embed");
  } catch {
    return false;
  }
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-surface p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-foreground [&_svg]:size-5">
        {icon}
      </span>
      <div className="min-w-0 text-[15px]">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        <div className="mt-1 text-muted">{children}</div>
      </div>
    </div>
  );
}

export default async function ContactPage() {
  const site = await getSiteSettings();
  const addressLines = [
    site.address.line1,
    site.address.line2,
    [site.address.city, site.address.state].filter(Boolean).join(", "),
    site.address.pincode,
  ].filter(Boolean);
  const mapUrl = isMapsEmbed(site.mapEmbedUrl) ? site.mapEmbedUrl : null;
  const tel = site.phone ? `+${digitsOnly(site.phone)}` : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${site.businessName}`,
    url: absoluteUrl("/contact"),
    mainEntity: {
      "@type": "Store",
      name: site.businessName,
      url: absoluteUrl("/"),
      ...(tel ? { telephone: tel } : {}),
      ...(site.email ? { email: site.email } : {}),
      ...(site.address.city
        ? {
            address: {
              "@type": "PostalAddress",
              ...(site.address.line1 ? { streetAddress: [site.address.line1, site.address.line2].filter(Boolean).join(", ") } : {}),
              addressLocality: site.address.city,
              ...(site.address.state ? { addressRegion: site.address.state } : {}),
              ...(site.address.pincode ? { postalCode: site.address.pincode } : {}),
              addressCountry: "IN",
            },
          }
        : {}),
    },
  };

  return (
    <>
      <PageHeader
        title="Contact us"
        description="Real people, happy to help — whether you're choosing a laptop, tracking an order or need warranty support."
        crumbs={[{ name: "Contact", path: "/contact" }]}
      />

      <div className="container-page py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-14">
          <section aria-labelledby="contact-form-title" className="min-w-0">
            <h2 id="contact-form-title" className="text-xl font-semibold tracking-tight">
              Send us a message
            </h2>
            <p className="mt-1.5 mb-6 text-[15px] text-muted">
              Looking for an order update?{" "}
              <Link href="/track-order" className="font-medium text-accent hover:underline">
                Track your order
              </Link>{" "}
              or browse the{" "}
              <Link href="/faq" className="font-medium text-accent hover:underline">
                FAQ
              </Link>
              .
            </p>
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-7">
              <ContactForm />
            </div>
          </section>

          <div className="space-y-3">
            {site.phone && (
              <InfoCard icon={<Phone />} title="Call us">
                <a href={`tel:${tel}`} className="num font-medium text-foreground hover:text-accent">
                  {site.phone}
                </a>
              </InfoCard>
            )}
            {site.whatsappNumber && (
              <InfoCard icon={<WhatsAppIcon />} title="WhatsApp">
                <p>Quick answers, photos and videos of a laptop on request.</p>
                <WhatsAppButton
                  location="contact_page"
                  className="mt-2 inline-flex items-center gap-1.5 font-medium text-foreground hover:text-accent"
                >
                  Chat on WhatsApp <span aria-hidden>→</span>
                </WhatsAppButton>
              </InfoCard>
            )}
            {site.email && (
              <InfoCard icon={<Mail />} title="Email">
                <a href={`mailto:${site.email}`} className="font-medium break-all text-foreground hover:text-accent">
                  {site.email}
                </a>
              </InfoCard>
            )}
            {addressLines.length > 0 && (
              <InfoCard icon={<MapPin />} title="Address">
                <address className="not-italic">
                  {addressLines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </address>
              </InfoCard>
            )}
            {site.businessHours.length > 0 && (
              <InfoCard icon={<Clock />} title="Business hours">
                <dl className="space-y-1">
                  {site.businessHours.map((h) => (
                    <div key={h.days} className="flex flex-wrap justify-between gap-x-4">
                      <dt>{h.days}</dt>
                      <dd className="num text-foreground">{h.hours}</dd>
                    </div>
                  ))}
                </dl>
              </InfoCard>
            )}
          </div>
        </div>

        <section aria-label="Location map" className="mt-12">
          {mapUrl ? (
            <div className="overflow-hidden rounded-xl border border-border bg-subtle">
              <iframe
                src={mapUrl}
                title={`Map showing the location of ${site.businessName}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-[320px] w-full border-0 sm:h-[400px]"
                allowFullScreen
              />
            </div>
          ) : (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center",
              )}
            >
              <MapPin className="size-6 text-faint" aria-hidden />
              <p className="font-medium">
                {site.address.city ? `Based in ${[site.address.city, site.address.state].filter(Boolean).join(", ")}` : "Shipping across India"}
              </p>
              <p className="max-w-sm text-[14px] text-muted">
                We deliver to serviceable PIN codes across India with insured, tracked shipping.
              </p>
            </div>
          )}
        </section>
      </div>
      <JsonLd data={jsonLd} />
    </>
  );
}
