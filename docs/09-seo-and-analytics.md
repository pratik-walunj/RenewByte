# 09 — SEO & analytics

## Page metadata

Every page sets its title, description, canonical URL, Open Graph and Twitter card through `pageMetadata()` in `src/lib/seo.ts`. Titles get the suffix from CMS → Site settings → SEO (default " | RenewByte").

| Page | Title / description source |
| --- | --- |
| Homepage | Fixed title + hero text from the CMS |
| Product | Product SEO title/description (admin), otherwise generated from name, processor, RAM, grade and warranty |
| Brand / Category / Price pages | CMS landing page SEO fields, otherwise the brand/category SEO fields |
| Blog post | Post SEO fields (article type, publish date) |
| Policy and content pages | Page SEO fields in the CMS |
| Account, cart, checkout, order, compare, wishlist, sign-in, admin | `noindex` |

## Clean URLs

| URL | Page |
| --- | --- |
| `/laptops` | All laptops |
| `/laptops/<product-slug>` | Product |
| `/laptops/under-20000`, `/under-30000`, `/under-50000` | Price landing pages (CMS) |
| `/brand/dell`, `/brand/hp`, … | Brand pages |
| `/category/gaming-laptops`, … | Category pages |
| `/deals`, `/blog`, `/blog/<slug>` | Deals, blog |
| `/laptops/dell` | **308 permanent redirect** → `/brand/dell` (avoids duplicate pages) |
| `/laptops/gaming` | **308** → `/category/gaming-laptops` |

Filtered, sorted, searched and paginated views (e.g. `/laptops?ram=16gb`) are shareable but marked `noindex` and point their canonical at the clean page, so Google doesn't index thin duplicates. Unknown products, brands and posts return a real **404**.

## Structured data (JSON-LD)

| Type | Where |
| --- | --- |
| Organization, WebSite + SearchAction | Every shop page |
| Product + Offer (price, availability, refurbished condition, shipping details) | Product pages |
| AggregateRating + Review | Product pages — **only when real approved reviews exist** |
| BreadcrumbList | Every page with breadcrumbs |
| Article | Blog posts |
| FAQPage | `/faq`, homepage FAQ, landing pages |
| ContactPage / Store | `/contact` |

Check any page with Google's Rich Results Test: https://search.google.com/test/rich-results

## Sitemap and robots

- `/sitemap.xml` — static pages, blog posts, price landing pages, brands, categories and every published product with its image. Refreshes hourly.
- `/robots.txt` — allows the shop, blocks `/admin`, `/keystatic`, `/api/`, `/account`, `/cart`, `/checkout`, `/order/`, `/wishlist`, `/compare` and sign-in pages.

## Google Search Console

1. https://search.google.com/search-console → add your domain.
2. Choose **HTML tag** verification, copy the `content="…"` value into Vercel as `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (Config), redeploy, click Verify.
3. **Sitemaps** → submit `sitemap.xml`.

## Analytics

Set the IDs either in CMS → Site settings → Analytics, or as Vercel variables (`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID`). Scripts load only when an ID is present. The CMS value wins over the variable.

Events sent automatically (to GTM dataLayer, GA4 and Meta Pixel):

| Event | When |
| --- | --- |
| `view_item` | Product page opened |
| `search` | Search submitted |
| `add_to_cart` | Added to cart |
| `add_to_wishlist` | Saved to wishlist |
| `begin_checkout` | "Buy now" or "Proceed to checkout" |
| `purchase` | Confirmation page (once per order) |
| `whatsapp_click` | Any WhatsApp button (with location and product) |

The code is in `src/lib/analytics.ts` (`track()`).

## Performance

- Pages render on the server; only interactive parts ship JavaScript.
- Images use `next/image` (AVIF/WebP, responsive sizes, lazy loading); the hero and first product images load with priority.
- Fonts (Geist) are self-hosted — no external font requests.
- Catalogue queries are cached and cleared instantly when admin edits data.
- Quick view is loaded only when opened.

Run Lighthouse from Chrome DevTools (Lighthouse tab) on the live site to measure.
