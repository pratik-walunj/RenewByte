import "server-only";
import { cache } from "react";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "@/keystatic.config";

/**
 * Typed, request-memoised access to Keystatic content. Content files live in
 * /content and are read from disk (they are committed to the repository).
 */
export const reader = createReader(process.cwd(), keystaticConfig);

export const getSiteSettings = cache(async () => {
  const s = await reader.singletons.siteSettings.read();
  const envPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "";
  const envEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
  const envWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  return {
    businessName: s?.businessName || "RenewByte",
    legalName: s?.legalName || s?.businessName || "RenewByte",
    tagline: s?.tagline || "Certified refurbished laptops",
    logo: s?.logo || null,
    phone: s?.phone || envPhone,
    whatsappNumber: s?.whatsappNumber || envWhatsapp,
    whatsappMessage: s?.whatsappMessage || "Hi, I have a question about a refurbished laptop.",
    email: s?.email || envEmail,
    gstin: s?.gstin || "",
    address: {
      line1: s?.address.line1 || "",
      line2: s?.address.line2 || "",
      city: s?.address.city || "",
      state: s?.address.state || "",
      pincode: s?.address.pincode || "",
    },
    businessHours: s?.businessHours ?? [],
    mapEmbedUrl: s?.mapEmbedUrl || null,
    social: {
      instagram: s?.social.instagram || null,
      facebook: s?.social.facebook || null,
      youtube: s?.social.youtube || null,
      x: s?.social.x || null,
      linkedin: s?.social.linkedin || null,
    },
    analytics: {
      gaId: s?.analytics.gaId || process.env.NEXT_PUBLIC_GA_ID || "",
      gtmId: s?.analytics.gtmId || process.env.NEXT_PUBLIC_GTM_ID || "",
      metaPixelId: s?.analytics.metaPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
    },
    seo: {
      defaultTitle: s?.seo.defaultTitle || "RenewByte — Certified Refurbished Laptops",
      titleSuffix: s?.seo.titleSuffix ?? " | RenewByte",
      defaultDescription:
        s?.seo.defaultDescription ||
        "Professionally tested refurbished laptops from trusted brands, with transparent condition grades and warranty.",
      ogImage: s?.seo.ogImage || null,
      twitterHandle: s?.seo.twitterHandle || "",
    },
  };
});

export type SiteSettings = Awaited<ReturnType<typeof getSiteSettings>>;

export const getAnnouncement = cache(async () => {
  const a = await reader.singletons.announcement.read();
  if (!a || !a.enabled) return [];
  return a.messages.filter((m) => m.text);
});

export const getNavigation = cache(async () => {
  const n = await reader.singletons.navigation.read();
  return { primary: n?.primary ?? [], secondary: n?.secondary ?? [] };
});

export const getFooter = cache(async () => {
  const f = await reader.singletons.footer.read();
  return {
    about: f?.about ?? "",
    columns: f?.columns ?? [],
    paymentNote: f?.paymentNote ?? "",
    bottomNote: f?.bottomNote ?? "",
  };
});

export const getHomepage = cache(async () => reader.singletons.homepage.read());
export type HomepageContent = NonNullable<Awaited<ReturnType<typeof getHomepage>>>;

export const getConditionGrades = cache(async () => {
  const g = await reader.singletons.conditionGrades.read();
  return { intro: g?.intro ?? "", grades: g?.grades ?? [] };
});
export type ConditionGradesContent = Awaited<ReturnType<typeof getConditionGrades>>;

export const getRefurbishProcess = cache(async () => reader.singletons.refurbishProcess.read());

// ─── Collections ────────────────────────────────────────────

export const getAllPosts = cache(async () => {
  const posts = await reader.collections.posts.all();
  return posts
    .map((p) => ({ slug: p.slug, ...p.entry }))
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
});

export const getPost = cache(async (slug: string) => {
  const post = await reader.collections.posts.read(slug, { resolveLinkedFiles: true });
  return post ? { slug, ...post } : null;
});

export const getPage = cache(async (slug: string) => {
  const page = await reader.collections.pages.read(slug, { resolveLinkedFiles: true });
  return page ? { slug, ...page } : null;
});

export const getLandingPage = cache(async (slug: string) => {
  const page = await reader.collections.landingPages.read(slug, { resolveLinkedFiles: true });
  return page ? { slug, ...page } : null;
});

export const getAllLandingPages = cache(async () => {
  const pages = await reader.collections.landingPages.all();
  return pages.map((p) => ({ slug: p.slug, ...p.entry }));
});

/** Content attached to a brand or category page, matched by filter slug. */
export const getLandingContentFor = cache(async (kind: "brand" | "category" | "catalog", slug?: string) => {
  const pages = await reader.collections.landingPages.all({ resolveLinkedFiles: true });
  const match = pages.find((p) => {
    if (p.entry.kind !== kind) return false;
    if (kind === "catalog") return true;
    const target = kind === "brand" ? p.entry.filters.brand : p.entry.filters.category;
    return target === slug || p.slug === slug;
  });
  return match ? { slug: match.slug, ...match.entry } : null;
});

export const getFaqs = cache(async () => {
  const faqs = await reader.collections.faqs.all();
  return faqs
    .map((f) => ({ slug: f.slug, ...f.entry }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
});

export const getTestimonials = cache(async () => {
  const items = await reader.collections.testimonials.all();
  return items
    .map((t) => ({ slug: t.slug, ...t.entry }))
    .filter((t) => t.published)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
});

export const getBanners = cache(async (placement: string) => {
  const today = new Date().toISOString().slice(0, 10);
  const items = await reader.collections.banners.all();
  return items
    .map((b) => ({ slug: b.slug, ...b.entry }))
    .filter(
      (b) =>
        b.active &&
        b.placement === placement &&
        (!b.startsAt || b.startsAt <= today) &&
        (!b.endsAt || b.endsAt >= today),
    )
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
});

export const BLOG_CATEGORY_LABEL: Record<string, string> = {
  "buying-guide": "Laptop Buying Guide",
  "refurbished-guide": "Refurbished Laptop Guide",
  comparison: "Laptop Comparison",
  technology: "Technology",
  maintenance: "Maintenance",
  tips: "Tips",
};
