import "server-only";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/cms";
import { absoluteUrl } from "@/lib/utils";

/**
 * Consistent page metadata: unique title, description, canonical URL,
 * Open Graph and Twitter cards. Titles get the CMS suffix via the root template.
 */
export async function pageMetadata(input: {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  imageAlt?: string;
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  absoluteTitle?: boolean;
}): Promise<Metadata> {
  const site = await getSiteSettings();
  const description = (input.description || site.seo.defaultDescription).slice(0, 300);
  const image = input.image || site.seo.ogImage || "/images/brand/og-default.png";
  const url = absoluteUrl(input.path);
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description,
    alternates: { canonical: url },
    robots: input.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: input.type ?? "website",
      url,
      title: input.title,
      description,
      siteName: site.businessName,
      locale: "en_IN",
      images: [{ url: image, alt: input.imageAlt ?? input.title }],
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [image],
      ...(site.seo.twitterHandle ? { site: site.seo.twitterHandle } : {}),
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
