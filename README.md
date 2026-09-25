# RenewByte — Certified Refurbished Laptop Store

A production-ready e-commerce platform for selling professionally refurbished laptops in India. It covers the storefront (catalogue, filters, search, compare, wishlist, cart, checkout), Razorpay payments with server-side verification, order tracking, customer accounts, an admin dashboard, and a Git-based CMS for marketing content.

> **Demo data:** `npm run db:seed` creates 24 sample laptops flagged `isDemo`. Their specs are realistic for each model, but prices, stock and battery figures are illustrative, and each one shows a "Demo listing" notice. The product images are neutral generated renders. Delete or replace the demo products before launch.

---

## Contents

1. [Tech stack](#tech-stack)
2. [Project structure](#project-structure)
3. [Getting started (local)](#getting-started-local)
4. [Environment variables](#environment-variables)
5. [Database](#database)
6. [CMS (Keystatic)](#cms-keystatic)
7. [Admin](#admin)
8. [Payments (Razorpay)](#payments-razorpay)
9. [Images (Cloudinary)](#images-cloudinary)
10. [Deployment (Vercel + managed Postgres)](#deployment)
11. [SEO](#seo)
12. [Architecture notes](#architecture-notes)
13. [Scripts](#scripts)

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions, `proxy.ts`) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 with design tokens in `src/app/globals.css`; shadcn-style components on `radix-ui` |
| Database | PostgreSQL + Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`) |
| CMS | Keystatic (Git-based; content lives in `/content`) |
| Forms | React Hook Form + Zod (the same schemas are re-validated on the server) |
| Motion | Framer Motion (subtle; respects `prefers-reduced-motion`) |
| Icons | Lucide React |
| Toasts | Sonner |
| Payments | Razorpay (REST API + Checkout.js, no SDK) |
| Images | `next/image`; Cloudinary-ready (signed direct uploads from admin) |
| Email | Resend HTTP API (optional; logs to console without a key) |
| Auth | Built-in: scrypt password hashing + database sessions (HMAC-hashed tokens in httpOnly cookies) |

No auth, payment, chart or state-management libraries are added. Those pieces are small, auditable modules in `src/lib` and `src/server`.

## Project structure

```
content/                 Keystatic content (YAML + Markdoc) — committed to Git
  settings/              site, announcement, navigation, footer, condition grades, refurbish process
  home.yaml              homepage copy
  blog/ pages/ landing/ faqs/ testimonials/ banners/
keystatic.config.ts      CMS schema
prisma/
  schema.prisma          database schema
  migrations/            SQL migrations
  seed.ts, seed-data.ts  demo catalogue + first admin
public/images/           generated demo renders, blog covers, hero
scripts/                 generate-images.mjs, create-admin.ts
src/
  proxy.ts               optimistic route gate for /admin, /account, /keystatic
  app/
    (store)/             storefront (shared header/footer layout)
      page.tsx           homepage
      laptops/           /laptops and /laptops/[slug] (product · price landing page · brand alias)
      brand/[slug] category/[slug] deals compare wishlist cart checkout
      order/[id] track-order account/** (auth)/login|register|forgot-password|reset-password
      blog/ (content)/about|warranty|returns|shipping|privacy-policy|terms|careers|faq|contact|how-we-refurbish|condition-grades|sell
    admin/**             admin dashboard (own layout)
    keystatic/           CMS admin UI (staff only)
    api/                 search, payments (verify/failure/webhook), cron, keystatic, admin
    actions/             server actions (cart, checkout, store, reviews, auth, account, content, admin/*)
    sitemap.ts robots.ts manifest.ts
  components/            ui, layout, product, filters, cart, checkout, search, home, account, orders, admin, cms, marketing, forms
  lib/                   db, env, auth, cms reader, filters, format, seo, analytics, rate-limit, security, validation
  server/                catalog queries, cart, pricing, coupons, shipping, inventory, orders, payments, email
```

## Getting started (local)

Prerequisites: **Node.js 20.9+** (developed on Node 24) and **Docker** for the local database, or any PostgreSQL 14+ instance.

```bash
npm install                      # also runs `prisma generate`
cp .env.example .env             # then edit values (see below)
npm run db:up                    # Postgres 17 in Docker on localhost:5440
npm run db:deploy                # apply migrations
npm run db:seed                  # demo catalogue, coupons, shipping zones, admin user
npm run dev                      # http://localhost:3000
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin (sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- CMS: http://localhost:3000/keystatic (staff only)

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run build` does not need a database: catalogue pages render per request with cached data, and the sitemap degrades gracefully.

## Environment variables

See `.env.example` for the full annotated list. Anything prefixed `NEXT_PUBLIC_` is visible to the browser. Nothing else is ever sent to the client.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical origin (canonical URLs, sitemap, emails) |
| `AUTH_SECRET` | ✅ prod | ≥ 32 random chars. Keys the session-token hashes. `openssl rand -base64 32` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | seed | First administrator (password ≥ 10 chars) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | for online payments | API keys (server only) |
| `RAZORPAY_WEBHOOK_SECRET` | for webhooks | Webhook signing secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | optional | Same as key id (the key id is public by design) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_FOLDER` | optional | Admin image uploads |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_EMAIL` | optional | Fallbacks when the CMS values are empty |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | optional | Analytics (CMS values take priority) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | optional | Search Console verification meta tag |
| `RESEND_API_KEY`, `EMAIL_FROM` | optional | Transactional email (order confirmation, password reset) |
| `NEXT_PUBLIC_KEYSTATIC_STORAGE` | prod | `local` (dev) or `github` (production) |
| `NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO`, `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | prod | Keystatic GitHub mode |
| `CRON_SECRET` | prod | Protects `/api/cron/*` |

**Never commit `.env`.** It is already listed in `.gitignore`.

## Database

The schema lives in `prisma/schema.prisma` and the connection is configured in `prisma.config.ts` (the Prisma 7 style). All money is stored as **integer paise**.

| Area | Models |
| --- | --- |
| Identity | `User` (role: CUSTOMER / STAFF / ADMIN), `Session`, `PasswordResetToken`, `Address` |
| Catalogue | `Brand`, `Category`, `Product`, `ProductImage`, `ProductSpecification` |
| Inventory | `Inventory` (quantity, reserved, lowStockThreshold), `InventoryAdjustment` (audit log) |
| Shopping | `Cart` (user or guest token), `CartItem` (with save-for-later), `WishlistItem` |
| Orders | `Order` (address snapshot, totals, status), `OrderItem` (product snapshot), `OrderStatusEvent` (timeline), `Payment`, `WebhookEvent` (idempotency) |
| Promotions | `Coupon` (percentage/fixed, min order, max discount, dates, usage & per-user limits, product/category scope), `CouponRedemption` |
| Reviews | `Review` (moderated: PENDING / APPROVED / REJECTED, verified-purchase flag) |
| Settings | `StoreSettings` (tax, shipping, COD, payments), `ShippingZone` (state / PIN-prefix based) |
| Inbox | `ContactMessage`, `TradeInRequest`, `NewsletterSubscriber` |

Roles are a Prisma enum rather than a table, because the three roles are fixed and checked in code.

Commands:

```bash
npm run db:migrate      # create a new migration after editing schema.prisma (dev)
npm run db:deploy       # apply migrations (CI / production)
npm run db:seed         # idempotent demo seed
npm run db:studio       # browse data
```

## CMS (Keystatic)

### Responsibility split

| PostgreSQL (admin at `/admin`) | Keystatic (CMS at `/keystatic`) |
| --- | --- |
| Products, specs, images, prices | Homepage copy, hero, trust features, section headings |
| Inventory, orders, payments | Announcement bar, navigation, footer |
| Customers, addresses, carts, wishlists | Blog posts, static & policy pages |
| Coupons, reviews, shipping rules, tax | FAQs, testimonials, promotional banners |
| | Condition-grade definitions, "How we refurbish" process |
| | SEO landing-page copy for brand, category and price pages |
| | Business details, social links, analytics IDs, SEO defaults |

Transactional data never goes in the CMS, and marketing copy never goes in the database, so nothing is duplicated. The spec's `BlogPost`, `FAQ`, `Banner`, `Page` and SEO models are deliberately implemented as Keystatic collections rather than database tables. Brand and category records live in Postgres (products reference them), and their long-form landing copy lives in `content/landing/*`.

### Local

With `NEXT_PUBLIC_KEYSTATIC_STORAGE=local`, edits made at `/keystatic` are written straight to `/content` on disk. Commit them like code.

### Production (GitHub mode)

Serverless hosts have a read-only filesystem, so in production Keystatic commits to GitHub and Vercel redeploys:

1. Push the repo to GitHub.
2. Set `NEXT_PUBLIC_KEYSTATIC_STORAGE=github` and `NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO=owner/repo`.
3. Visit `/keystatic` on your deployed site. Keystatic walks you through creating a GitHub App and shows the values for `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` and `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`. Add them in Vercel and redeploy.

`/keystatic` and `/api/keystatic` are restricted to signed-in staff in both modes.

## Admin

- **Create the first admin:** set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then run `npm run db:seed`. Alternatively, run `npm run admin:create -- you@store.in "a-strong-password" "Your Name"`, which also promotes or resets an existing user.
- **Roles:** `ADMIN` has full access. `STAFF` can manage catalogue, inventory, orders and reviews, but cannot change settings or user roles. `CUSTOMER` is a shopper.
- **Features:** dashboard KPIs and charts, product CRUD (duplicate, publish, featured, best-seller, deal flags, SEO), inventory with an adjustment log and low/out-of-stock views, orders with a status workflow and courier tracking, customers, coupons, review moderation, brands and categories, store settings with shipping zones, and an inbox for contact, trade-in and newsletter submissions.

### Order statuses

`PENDING → PAYMENT_PROCESSING → PAID → PROCESSING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED`, plus `CANCELLED` and `REFUNDED`. The admin UI only offers valid transitions. Cancelling or refunding automatically returns stock, or releases the reservation.

## Payments (Razorpay)

1. Create API keys in the Razorpay Dashboard (Account & Settings → API Keys). Use **test mode** first.
2. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. Add a webhook: Dashboard → Webhooks → `https://<your-domain>/api/payments/razorpay/webhook`, with events `payment.captured`, `payment.failed`, `order.paid` and `refund.processed`. Set its secret as `RAZORPAY_WEBHOOK_SECRET`.
4. Enable **automatic capture** (Account & Settings → Payment capture) so payments settle as `captured`.

Flow (never trusts the browser):

1. `placeOrder` (server action) re-prices the cart from the database, validates the coupon, computes shipping and GST, creates the order and **reserves stock** with a conditional SQL update, so concurrent checkouts can't oversell.
2. The server creates a Razorpay order for the exact server-computed amount.
3. Checkout.js collects payment. The browser posts `order_id`, `payment_id` and `signature` to `/api/payments/razorpay/verify`.
4. The server verifies the HMAC signature, **fetches the payment from Razorpay** to confirm status and amount, then marks the order paid and commits stock. This step is idempotent.
5. The webhook reconciles anything the browser missed (closed tab, network loss). Duplicate deliveries are ignored via `WebhookEvent`.
6. `/api/cron/release-reservations` (Vercel Cron, see `vercel.json`) cancels unpaid orders older than 30 minutes and frees their stock. On Vercel Hobby, cron jobs run at most daily, so use Pro or an external scheduler that calls the endpoint with `Authorization: Bearer $CRON_SECRET`.

**Cash on delivery** is available without Razorpay keys, toggled in Admin → Settings, with an optional fee and maximum order value. If Razorpay isn't configured, checkout falls back to COD automatically.

## Images (Cloudinary)

- Product images are ordinary URLs (`ProductImage.url`), so you can use files in `/public`, Cloudinary, or any host added to `images.remotePatterns` in `next.config.ts`.
- With `CLOUDINARY_*` set, the admin product form uploads directly to Cloudinary using a **signed** upload. The signature comes from `/api/admin/cloudinary/sign`, which is staff only, and the API secret never reaches the browser.
- `res.cloudinary.com` is already allowed for `next/image`, which serves AVIF/WebP at responsive sizes.
- `npm run images:generate` re-creates the neutral demo renders, hero and blog covers.

## Deployment

### Vercel

1. Create a managed PostgreSQL database (Neon, Supabase, Vercel Postgres, RDS, etc.) and copy its connection string. Use the pooled URL on serverless.
2. Import the GitHub repo into Vercel.
3. Add every production environment variable (see above), especially `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `AUTH_SECRET`, the Razorpay keys and webhook secret, `CRON_SECRET`, and the Keystatic GitHub variables.
4. Set the build command to `prisma migrate deploy && next build` so migrations run on each deploy. Alternatively, run `npm run db:deploy` from CI.
5. Run the seed once against production **only if you want demo data**. Otherwise just create an admin with `npm run admin:create` pointed at the production `DATABASE_URL`.
6. Configure the Razorpay webhook URL and GitHub App for Keystatic.

### Other Node hosts

`npm run build && npm start` on any Node 20.9+ host. Local-mode Keystatic works on a persistent disk.

### Production checklist

- [ ] Replace demo products and images, and remove `isDemo` listings.
- [ ] Fill in real business details, address, GSTIN and social links in CMS → Site settings.
- [ ] Have the template policy pages (warranty, returns, shipping, privacy, terms) reviewed by a legal advisor.
- [ ] Replace or delete sample testimonials. They carry a visible "Sample" label until then.
- [ ] Switch Razorpay to live keys and re-create the webhook with the live secret.
- [ ] Set analytics IDs, verify the domain in Google Search Console, and submit `/sitemap.xml`.
- [ ] For multi-instance hosting, swap the in-memory rate limiter (`src/lib/rate-limit.ts`) for Redis (e.g. Upstash).

## SEO

- **Metadata:** every page builds its title, meta description, canonical URL, Open Graph and Twitter card through `pageMetadata()` in `src/lib/seo.ts`. Titles use the CMS suffix template.
- **Structured data (JSON-LD):** Organization and WebSite with a SearchAction (store layout), Product with Offer, Brand, shipping details, AggregateRating and Review (only when real approved reviews exist), BreadcrumbList (every page with breadcrumbs), Article (blog posts), and FAQPage (FAQ, homepage and landing pages).
- **Crawling:** `sitemap.xml` includes static pages, blog posts, landing pages, brands, categories and products with images. `robots.txt` blocks private areas, as do `X-Robots-Tag` headers from `proxy.ts`.
- **Clean URLs:** `/laptops/<product-slug>`, `/brand/dell`, `/category/gaming-laptops`, `/laptops/under-30000`, `/blog/<slug>`. `/laptops/dell` permanently redirects to `/brand/dell` to avoid duplicate pages.
- **Thin-content protection:** filtered, sorted and paginated variants are `noindex`. Every indexable landing page carries unique CMS copy, highlights and FAQs.
- **Performance:** Server Components by default, `next/image` (AVIF/WebP), self-hosted Geist fonts, `optimizePackageImports`, dynamic import for quick view, and cached catalogue queries (`unstable_cache` with tag invalidation from admin).

## Architecture notes

- **Security:** Zod validation on every server action and route; per-IP rate limits on auth, checkout, coupons, search, reviews and forms; httpOnly SameSite=Lax cookies; Server Actions' built-in origin checks, plus same-origin checks on JSON routes; role checks in every admin action, not only layouts; HMAC-verified payments and webhooks; security headers in `next.config.ts`; JSON-LD escaped.
- **Pricing:** prices are GST-inclusive by default. The GST component is shown in the summary. Switch `pricesIncludeTax` off in settings to add tax on top.
- **Shipping:** Admin → Settings configures free-shipping thresholds, flat fees, express delivery and state/PIN-prefix zones. `quoteShipping()` returns a provider-agnostic quote, ready for a courier API (Shiprocket, Delhivery) later.
- **Analytics:** `track()` in `src/lib/analytics.ts` pushes `view_item`, `search`, `add_to_cart`, `add_to_wishlist`, `begin_checkout`, `purchase` and `whatsapp_click` to GTM's dataLayer, GA4 and Meta Pixel, but only when their IDs are configured.
- **PWA:** web manifest and icons make the site installable. No service worker is registered, to keep caching predictable for a store.

## Scripts

| Script | What it does |
| --- | --- |
| `dev` / `build` / `start` | Next.js |
| `lint` / `typecheck` | ESLint (flat config) / `tsc --noEmit` |
| `db:up` | Start the local Postgres container |
| `db:migrate` / `db:deploy` / `db:reset` | Prisma migrations |
| `db:seed` | Demo catalogue + first admin |
| `db:studio` | Prisma Studio |
| `admin:create` | Create or promote an admin |
| `images:generate` | Regenerate demo artwork |
