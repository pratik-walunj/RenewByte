import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { SiteSettings } from "@/lib/cms";
import { Button } from "@/components/ui/button";
import { Meta, Panel } from "@/components/admin/ui";

function Value({ v }: { v: string | null | undefined }) {
  return v ? <span className="break-words">{v}</span> : <span className="text-faint">Not set</span>;
}

/** Read-only view of CMS-managed business details, with a link to edit them in Keystatic. */
export function BusinessCard({ site }: { site: SiteSettings }) {
  const address = [site.address.line1, site.address.line2, site.address.city, site.address.state, site.address.pincode]
    .filter(Boolean)
    .join(", ");
  const social = Object.entries(site.social).filter(([, url]) => Boolean(url));
  return (
    <Panel
      id="business"
      title="Business & brand"
      description="Managed in the CMS so every page, email and structured-data block reads from one source of truth."
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/keystatic/singleton/siteSettings" prefetch={false}>
            <ExternalLink /> Edit in CMS
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="eyebrow mb-2">Identity</p>
          <dl className="flex flex-col gap-1.5">
          <Meta label="Business name"><Value v={site.businessName} /></Meta>
          <Meta label="Legal name"><Value v={site.legalName} /></Meta>
          <Meta label="Tagline"><Value v={site.tagline} /></Meta>
          <Meta label="Logo"><Value v={site.logo} /></Meta>
          <Meta label="GSTIN"><Value v={site.gstin} /></Meta>
        </dl>
        </div>
        <div>
          <p className="eyebrow mb-2">Contact</p>
          <dl className="flex flex-col gap-1.5">
          <Meta label="Phone"><Value v={site.phone} /></Meta>
          <Meta label="WhatsApp"><Value v={site.whatsappNumber} /></Meta>
          <Meta label="Email"><Value v={site.email} /></Meta>
          <Meta label="Address"><Value v={address} /></Meta>
        </dl>
        </div>
        <div>
          <p className="eyebrow mb-2">SEO defaults</p>
          <dl className="flex flex-col gap-1.5">
          <Meta label="Default title"><Value v={site.seo.defaultTitle} /></Meta>
          <Meta label="Title suffix"><Value v={site.seo.titleSuffix} /></Meta>
          <Meta label="Description"><Value v={site.seo.defaultDescription} /></Meta>
          <Meta label="Share image"><Value v={site.seo.ogImage} /></Meta>
          <Meta label="X / Twitter"><Value v={site.seo.twitterHandle} /></Meta>
        </dl>
        </div>
        <div>
          <p className="eyebrow mb-2">Analytics & social</p>
          <dl className="flex flex-col gap-1.5">
          <Meta label="Google Analytics"><Value v={site.analytics.gaId} /></Meta>
          <Meta label="Tag Manager"><Value v={site.analytics.gtmId} /></Meta>
          <Meta label="Meta Pixel"><Value v={site.analytics.metaPixelId} /></Meta>
          <Meta label="Social profiles">
            {social.length ? <span className="capitalize">{social.map(([k]) => k).join(", ")}</span> : <Value v={null} />}
          </Meta>
        </dl>
        </div>
      </div>
      <p className="mt-5 border-t border-border pt-4 text-[13px] text-muted">
        Footer columns, navigation, announcement bar and page content are also edited in the{" "}
        <Link href="/keystatic" className="font-medium text-accent hover:underline" prefetch={false}>
          CMS
        </Link>
        .
      </p>
    </Panel>
  );
}
