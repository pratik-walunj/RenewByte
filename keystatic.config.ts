import { collection, config, fields, singleton } from "@keystatic/core";

/**
 * Keystatic CMS — marketing & editorial content.
 *
 * Transactional data (products, inventory, orders, customers, payments) lives in
 * PostgreSQL and is managed from /admin. Everything a marketer edits lives here.
 *
 * Storage: `local` writes to the repo on disk (development). In production set
 * NEXT_PUBLIC_KEYSTATIC_STORAGE=github so edits are committed to GitHub and the
 * site redeploys (see README → CMS setup).
 */

const storage =
  process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === "github"
    ? {
        kind: "github" as const,
        repo: (process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO || "your-org/renewbyte") as `${string}/${string}`,
      }
    : { kind: "local" as const };

const ICON_OPTIONS = [
  { label: "Shield / checkmark", value: "shield-check" },
  { label: "Badge / certified", value: "badge-check" },
  { label: "Wrench / repair", value: "wrench" },
  { label: "Lock / secure", value: "lock" },
  { label: "Truck / delivery", value: "truck" },
  { label: "Return arrow", value: "rotate-ccw" },
  { label: "Battery", value: "battery-charging" },
  { label: "Magnifier / inspection", value: "scan-search" },
  { label: "Cpu / hardware", value: "cpu" },
  { label: "Eraser / data wipe", value: "eraser" },
  { label: "Sparkles / cleaning", value: "sparkles" },
  { label: "Clipboard / checklist", value: "clipboard-check" },
  { label: "Package", value: "package" },
  { label: "Headset / support", value: "headset" },
  { label: "Leaf / sustainability", value: "leaf" },
  { label: "Wallet / value", value: "wallet" },
  { label: "Gauge / performance", value: "gauge" },
] as const;

const iconField = (label = "Icon") =>
  fields.select({ label, options: ICON_OPTIONS as unknown as { label: string; value: string }[], defaultValue: "shield-check" });

const seoFields = fields.object(
  {
    title: fields.text({ label: "SEO title", description: "Shown in search results. Aim for 50–60 characters." }),
    description: fields.text({
      label: "Meta description",
      multiline: true,
      description: "Shown under the title in search results. Aim for 140–160 characters.",
    }),
  },
  { label: "SEO" },
);

const linkFields = {
  label: fields.text({ label: "Label", validation: { isRequired: true } }),
  href: fields.text({ label: "Link (e.g. /laptops or https://…)", validation: { isRequired: true } }),
};

const imageField = (label: string, sub = "cms") =>
  fields.image({ label, directory: `public/images/${sub}`, publicPath: `/images/${sub}/` });

export default config({
  storage,
  ui: {
    brand: { name: "RenewByte CMS" },
    navigation: {
      "Site & layout": ["siteSettings", "announcement", "navigation", "footer"],
      Homepage: ["homepage", "banners", "testimonials"],
      "Trust content": ["conditionGrades", "refurbishProcess", "faqs"],
      Pages: ["pages", "landingPages"],
      Blog: ["posts"],
    },
  },

  singletons: {
    siteSettings: singleton({
      label: "Site settings",
      path: "content/settings/site",
      schema: {
        businessName: fields.text({ label: "Business name", validation: { isRequired: true } }),
        legalName: fields.text({ label: "Registered business name", description: "Used in the footer and policies." }),
        tagline: fields.text({ label: "Tagline" }),
        logo: imageField("Logo (optional — the text wordmark is used when empty)", "brand"),
        phone: fields.text({ label: "Phone number", description: "Displayed as written, e.g. +91 90000 00000" }),
        whatsappNumber: fields.text({ label: "WhatsApp number", description: "International format without +, e.g. 919000000000" }),
        whatsappMessage: fields.text({
          label: "Default WhatsApp message",
          defaultValue: "Hi, I have a question about a refurbished laptop.",
        }),
        email: fields.text({ label: "Support email" }),
        gstin: fields.text({ label: "GSTIN (optional)" }),
        address: fields.object(
          {
            line1: fields.text({ label: "Address line 1" }),
            line2: fields.text({ label: "Address line 2" }),
            city: fields.text({ label: "City" }),
            state: fields.text({ label: "State" }),
            pincode: fields.text({ label: "PIN code" }),
          },
          { label: "Business address" },
        ),
        businessHours: fields.array(
          fields.object({ days: fields.text({ label: "Days" }), hours: fields.text({ label: "Hours" }) }),
          { label: "Business hours", itemLabel: (p) => `${p.fields.days.value}: ${p.fields.hours.value}` },
        ),
        mapEmbedUrl: fields.url({
          label: "Google Maps embed URL",
          description: "Google Maps → Share → Embed a map → copy the src URL only.",
        }),
        social: fields.object(
          {
            instagram: fields.url({ label: "Instagram" }),
            facebook: fields.url({ label: "Facebook" }),
            youtube: fields.url({ label: "YouTube" }),
            x: fields.url({ label: "X / Twitter" }),
            linkedin: fields.url({ label: "LinkedIn" }),
          },
          { label: "Social links" },
        ),
        analytics: fields.object(
          {
            gaId: fields.text({ label: "Google Analytics 4 ID", description: "e.g. G-XXXXXXX. Leave empty to use the environment value." }),
            gtmId: fields.text({ label: "Google Tag Manager ID", description: "e.g. GTM-XXXXXX" }),
            metaPixelId: fields.text({ label: "Meta Pixel ID" }),
          },
          { label: "Analytics" },
        ),
        seo: fields.object(
          {
            defaultTitle: fields.text({ label: "Default page title" }),
            titleSuffix: fields.text({ label: "Title suffix", defaultValue: " | RenewByte" }),
            defaultDescription: fields.text({ label: "Default meta description", multiline: true }),
            ogImage: imageField("Default social share image (1200×630)", "brand"),
            twitterHandle: fields.text({ label: "X / Twitter handle", description: "e.g. @renewbyte" }),
          },
          { label: "SEO defaults" },
        ),
      },
    }),

    announcement: singleton({
      label: "Announcement bar",
      path: "content/settings/announcement",
      schema: {
        enabled: fields.checkbox({ label: "Show announcement bar", defaultValue: true }),
        messages: fields.array(
          fields.object({
            text: fields.text({ label: "Message", validation: { isRequired: true } }),
            href: fields.text({ label: "Optional link" }),
          }),
          { label: "Messages (rotate on small screens)", itemLabel: (p) => p.fields.text.value },
        ),
      },
    }),

    navigation: singleton({
      label: "Header navigation",
      path: "content/settings/navigation",
      schema: {
        primary: fields.array(
          fields.object({
            ...linkFields,
            highlight: fields.checkbox({ label: "Highlight (e.g. Deals)", defaultValue: false }),
          }),
          { label: "Primary links", itemLabel: (p) => p.fields.label.value },
        ),
        secondary: fields.array(fields.object(linkFields), {
          label: "Secondary links (mobile drawer & top bar)",
          itemLabel: (p) => p.fields.label.value,
        }),
      },
    }),

    footer: singleton({
      label: "Footer",
      path: "content/settings/footer",
      schema: {
        about: fields.text({ label: "Short about text", multiline: true }),
        columns: fields.array(
          fields.object({
            title: fields.text({ label: "Column title" }),
            links: fields.array(fields.object(linkFields), {
              label: "Links",
              itemLabel: (p) => p.fields.label.value,
            }),
          }),
          { label: "Link columns", itemLabel: (p) => p.fields.title.value },
        ),
        paymentNote: fields.text({ label: "Payments note", defaultValue: "Secure payments via UPI, cards, net banking & wallets" }),
        bottomNote: fields.text({ label: "Bottom note", multiline: true }),
      },
    }),

    homepage: singleton({
      label: "Homepage",
      path: "content/home",
      schema: {
        hero: fields.object(
          {
            eyebrow: fields.text({ label: "Eyebrow" }),
            headline: fields.text({ label: "Headline", multiline: true, validation: { isRequired: true } }),
            subheadline: fields.text({ label: "Supporting text", multiline: true }),
            primaryCta: fields.object(linkFields, { label: "Primary button" }),
            secondaryCta: fields.object(linkFields, { label: "Secondary button" }),
            image: imageField("Hero image", "home"),
            imageAlt: fields.text({ label: "Hero image alt text" }),
            checklistTitle: fields.text({ label: "Inspection card title" }),
            checklist: fields.array(fields.text({ label: "Item" }), {
              label: "Inspection card items",
              itemLabel: (p) => p.value,
            }),
          },
          { label: "Hero" },
        ),
        trustFeatures: fields.array(
          fields.object({
            icon: iconField(),
            title: fields.text({ label: "Title" }),
            description: fields.text({ label: "Description" }),
          }),
          { label: "Trust features (below hero)", itemLabel: (p) => p.fields.title.value },
        ),
        sections: fields.object(
          {
            brands: fields.object({ title: fields.text({ label: "Title" }), subtitle: fields.text({ label: "Subtitle" }) }, { label: "Shop by brand" }),
            categories: fields.object({ title: fields.text({ label: "Title" }), subtitle: fields.text({ label: "Subtitle" }) }, { label: "Shop by category" }),
            bestSellers: fields.object({ title: fields.text({ label: "Title" }), subtitle: fields.text({ label: "Subtitle" }) }, { label: "Best sellers" }),
            deals: fields.object(
              {
                title: fields.text({ label: "Title" }),
                subtitle: fields.text({ label: "Subtitle" }),
                ctaLabel: fields.text({ label: "Button label" }),
              },
              { label: "Deals" },
            ),
            featured: fields.object({ title: fields.text({ label: "Title" }), subtitle: fields.text({ label: "Subtitle" }) }, { label: "Featured products" }),
            reviews: fields.object({ title: fields.text({ label: "Title" }), subtitle: fields.text({ label: "Subtitle" }) }, { label: "Customer reviews" }),
            blog: fields.object({ title: fields.text({ label: "Title" }), subtitle: fields.text({ label: "Subtitle" }) }, { label: "Buying guides" }),
            faq: fields.object({ title: fields.text({ label: "Title" }), subtitle: fields.text({ label: "Subtitle" }) }, { label: "FAQ" }),
            process: fields.object({ title: fields.text({ label: "Title" }), subtitle: fields.text({ label: "Subtitle" }) }, { label: "How we refurbish" }),
          },
          { label: "Section headings" },
        ),
        whyRefurbished: fields.object(
          {
            title: fields.text({ label: "Title" }),
            subtitle: fields.text({ label: "Subtitle", multiline: true }),
            points: fields.array(
              fields.object({
                icon: iconField(),
                title: fields.text({ label: "Title" }),
                description: fields.text({ label: "Description", multiline: true }),
              }),
              { label: "Points", itemLabel: (p) => p.fields.title.value },
            ),
          },
          { label: "Why buy refurbished?" },
        ),
        newsletter: fields.object(
          {
            title: fields.text({ label: "Title" }),
            subtitle: fields.text({ label: "Subtitle" }),
            disclaimer: fields.text({ label: "Small print" }),
          },
          { label: "Newsletter" },
        ),
      },
    }),

    conditionGrades: singleton({
      label: "Condition grades",
      path: "content/settings/condition-grades",
      schema: {
        intro: fields.text({ label: "Intro (shown in the 'What does this grade mean?' dialog)", multiline: true }),
        grades: fields.array(
          fields.object({
            grade: fields.select({
              label: "Grade",
              options: [
                { label: "A+", value: "A_PLUS" },
                { label: "A", value: "A" },
                { label: "B", value: "B" },
                { label: "C", value: "C" },
              ],
              defaultValue: "A",
            }),
            name: fields.text({ label: "Display name", description: "e.g. Excellent" }),
            summary: fields.text({ label: "One-line summary" }),
            cosmetic: fields.text({ label: "Visual condition & cosmetic marks", multiline: true }),
            performance: fields.text({ label: "Performance condition", multiline: true }),
            battery: fields.text({ label: "Battery information", multiline: true }),
            warranty: fields.text({ label: "Warranty information", multiline: true }),
            idealFor: fields.text({ label: "Ideal for" }),
          }),
          { label: "Grades", itemLabel: (p) => `${p.fields.grade.value} — ${p.fields.name.value}` },
        ),
      },
    }),

    refurbishProcess: singleton({
      label: "How we refurbish",
      path: "content/settings/refurbish-process",
      schema: {
        title: fields.text({ label: "Page title" }),
        intro: fields.text({ label: "Intro", multiline: true }),
        steps: fields.array(
          fields.object({
            icon: iconField(),
            title: fields.text({ label: "Step title" }),
            description: fields.text({ label: "Description", multiline: true }),
          }),
          { label: "Steps", itemLabel: (p) => p.fields.title.value },
        ),
        commitments: fields.array(
          fields.object({
            icon: iconField(),
            title: fields.text({ label: "Title" }),
            description: fields.text({ label: "Description", multiline: true }),
          }),
          { label: "Trust commitments", itemLabel: (p) => p.fields.title.value },
        ),
        seo: seoFields,
      },
    }),
  },

  collections: {
    posts: collection({
      label: "Blog posts",
      path: "content/blog/*",
      slugField: "title",
      format: { contentField: "content" },
      entryLayout: "content",
      columns: ["title", "publishedAt"],
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        excerpt: fields.text({ label: "Excerpt", multiline: true, validation: { isRequired: true } }),
        category: fields.select({
          label: "Category",
          options: [
            { label: "Laptop Buying Guide", value: "buying-guide" },
            { label: "Refurbished Laptop Guide", value: "refurbished-guide" },
            { label: "Laptop Comparison", value: "comparison" },
            { label: "Technology", value: "technology" },
            { label: "Maintenance", value: "maintenance" },
            { label: "Tips", value: "tips" },
          ],
          defaultValue: "buying-guide",
        }),
        coverImage: imageField("Cover image", "blog"),
        coverAlt: fields.text({ label: "Cover image alt text" }),
        author: fields.text({ label: "Author", defaultValue: "RenewByte Team" }),
        publishedAt: fields.date({ label: "Published on", validation: { isRequired: true } }),
        updatedAt: fields.date({ label: "Last updated" }),
        readingMinutes: fields.integer({ label: "Reading time (minutes)", defaultValue: 5 }),
        featured: fields.checkbox({ label: "Feature on homepage", defaultValue: false }),
        seo: seoFields,
        content: fields.markdoc({ label: "Content" }),
      },
    }),

    pages: collection({
      label: "Static pages",
      path: "content/pages/*",
      slugField: "title",
      format: { contentField: "content" },
      entryLayout: "content",
      schema: {
        title: fields.slug({ name: { label: "Title" }, slug: { label: "URL slug", description: "e.g. warranty → /warranty" } }),
        subtitle: fields.text({ label: "Subtitle", multiline: true }),
        updatedAt: fields.date({ label: "Last updated" }),
        showContactCta: fields.checkbox({ label: "Show 'Need help?' contact block", defaultValue: true }),
        seo: seoFields,
        content: fields.markdoc({ label: "Content" }),
      },
    }),

    landingPages: collection({
      label: "SEO landing pages",
      path: "content/landing/*",
      slugField: "title",
      format: { contentField: "content" },
      entryLayout: "content",
      schema: {
        title: fields.slug({
          name: { label: "Internal title" },
          slug: {
            label: "URL slug",
            description: "Price pages live at /laptops/<slug>. Brand/category pages attach to /brand/<slug> or /category/<slug>.",
          },
        }),
        kind: fields.select({
          label: "Page type",
          options: [
            { label: "Listing page (/laptops/<slug>)", value: "listing" },
            { label: "Brand page content (/brand/<slug>)", value: "brand" },
            { label: "Category page content (/category/<slug>)", value: "category" },
            { label: "All laptops page (/laptops)", value: "catalog" },
          ],
          defaultValue: "listing",
        }),
        heading: fields.text({ label: "H1 heading", validation: { isRequired: true } }),
        intro: fields.text({ label: "Intro paragraph", multiline: true }),
        filters: fields.object(
          {
            brand: fields.text({ label: "Brand slug (e.g. dell)" }),
            category: fields.text({ label: "Category slug (e.g. gaming-laptops)" }),
            minPrice: fields.integer({ label: "Minimum price (₹)" }),
            maxPrice: fields.integer({ label: "Maximum price (₹)" }),
          },
          { label: "Product filter for listing pages" },
        ),
        highlights: fields.array(fields.text({ label: "Highlight" }), {
          label: "Key points",
          itemLabel: (p) => p.value,
        }),
        faqs: fields.array(
          fields.object({
            question: fields.text({ label: "Question" }),
            answer: fields.text({ label: "Answer", multiline: true }),
          }),
          { label: "Page FAQs", itemLabel: (p) => p.fields.question.value },
        ),
        seo: seoFields,
        content: fields.markdoc({ label: "Buying guide content (shown below products)" }),
      },
    }),

    faqs: collection({
      label: "FAQs",
      path: "content/faqs/*",
      slugField: "question",
      columns: ["question", "category"],
      schema: {
        question: fields.slug({ name: { label: "Question" } }),
        answer: fields.text({ label: "Answer", multiline: true, validation: { isRequired: true } }),
        category: fields.select({
          label: "Category",
          options: [
            { label: "General", value: "general" },
            { label: "Refurbishment & quality", value: "quality" },
            { label: "Orders & payments", value: "orders" },
            { label: "Shipping & delivery", value: "shipping" },
            { label: "Warranty", value: "warranty" },
            { label: "Returns", value: "returns" },
          ],
          defaultValue: "general",
        }),
        showOnHome: fields.checkbox({ label: "Show on homepage", defaultValue: false }),
        showOnProduct: fields.checkbox({ label: "Show on product pages", defaultValue: false }),
        sortOrder: fields.integer({ label: "Sort order", defaultValue: 0 }),
      },
    }),

    testimonials: collection({
      label: "Testimonials",
      path: "content/testimonials/*",
      slugField: "name",
      columns: ["name", "isSample"],
      schema: {
        name: fields.slug({ name: { label: "Customer name" } }),
        location: fields.text({ label: "City" }),
        rating: fields.integer({ label: "Rating (1–5)", defaultValue: 5, validation: { min: 1, max: 5 } }),
        quote: fields.text({ label: "Quote", multiline: true, validation: { isRequired: true } }),
        product: fields.text({ label: "Product purchased" }),
        date: fields.date({ label: "Date" }),
        isSample: fields.checkbox({
          label: "Sample content",
          description: "Sample testimonials are labelled 'Sample' on the site. Replace them with real, verifiable customer feedback.",
          defaultValue: false,
        }),
        published: fields.checkbox({ label: "Published", defaultValue: true }),
      },
    }),

    banners: collection({
      label: "Promotional banners",
      path: "content/banners/*",
      slugField: "title",
      columns: ["title", "placement", "active"],
      schema: {
        title: fields.slug({ name: { label: "Headline" } }),
        eyebrow: fields.text({ label: "Eyebrow" }),
        subtitle: fields.text({ label: "Subtitle", multiline: true }),
        cta: fields.object(linkFields, { label: "Button" }),
        image: imageField("Image (optional)", "banners"),
        imageAlt: fields.text({ label: "Image alt text" }),
        placement: fields.select({
          label: "Placement",
          options: [
            { label: "Homepage — after categories", value: "home-mid" },
            { label: "Homepage — before newsletter", value: "home-bottom" },
            { label: "Deals page — top", value: "deals-top" },
            { label: "All laptops — top", value: "catalog-top" },
          ],
          defaultValue: "home-mid",
        }),
        tone: fields.select({
          label: "Style",
          options: [
            { label: "Dark", value: "dark" },
            { label: "Light", value: "light" },
            { label: "Blue", value: "accent" },
          ],
          defaultValue: "dark",
        }),
        active: fields.checkbox({ label: "Active", defaultValue: true }),
        startsAt: fields.date({ label: "Start date (optional)" }),
        endsAt: fields.date({ label: "End date (optional)" }),
        sortOrder: fields.integer({ label: "Sort order", defaultValue: 0 }),
      },
    }),
  },
});
