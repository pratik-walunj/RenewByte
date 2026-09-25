import { Toaster } from "sonner";
import { getAnnouncement, getConditionGrades, getFooter, getNavigation, getSiteSettings } from "@/lib/cms";
import { absoluteUrl, digitsOnly } from "@/lib/utils";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppProvider } from "@/components/layout/whatsapp";
import { AnalyticsScripts } from "@/components/layout/analytics-scripts";
import { StoreProvider } from "@/components/providers/store-provider";
import { GradeProvider } from "@/components/product/grade";
import { JsonLd } from "@/components/seo/json-ld";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [site, announcement, nav, footer, grades] = await Promise.all([
    getSiteSettings(),
    getAnnouncement(),
    getNavigation(),
    getFooter(),
    getConditionGrades(),
  ]);

  const sameAs = Object.values(site.social).filter(Boolean);
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.businessName,
    legalName: site.legalName,
    url: absoluteUrl("/"),
    logo: absoluteUrl(site.logo || "/icon.svg"),
    ...(site.email ? { email: site.email } : {}),
    ...(site.phone
      ? { contactPoint: [{ "@type": "ContactPoint", telephone: `+${digitsOnly(site.phone)}`, contactType: "customer service", areaServed: "IN", availableLanguage: ["en", "hi"] }] }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.businessName,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/laptops")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <StoreProvider>
      <GradeProvider value={grades}>
        <WhatsAppProvider number={site.whatsappNumber} defaultMessage={site.whatsappMessage}>
          <a
            href="#main"
            className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Skip to content
          </a>
          <AnnouncementBar messages={announcement} />
          <SiteHeader
            primary={nav.primary.map((l) => ({ label: l.label, href: l.href, highlight: l.highlight }))}
            secondary={nav.secondary.map((l) => ({ label: l.label, href: l.href }))}
            businessName={site.businessName}
            logo={site.logo}
            phone={site.phone}
            whatsappNumber={site.whatsappNumber}
          />
          <main id="main" className="min-h-[60vh]">
            {children}
          </main>
          <SiteFooter
            settings={site}
            about={footer.about}
            columns={footer.columns}
            paymentNote={footer.paymentNote}
            bottomNote={footer.bottomNote}
          />
          <Toaster
            position="bottom-center"
            toastOptions={{ classNames: { toast: "!rounded-xl !border-border !shadow-pop !font-sans" } }}
          />
          <JsonLd data={organization} />
          <JsonLd data={website} />
          <AnalyticsScripts {...site.analytics} />
        </WhatsAppProvider>
      </GradeProvider>
    </StoreProvider>
  );
}
