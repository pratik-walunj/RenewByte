# 01 — Overview

## What RenewByte does

Customers can:

- Browse, search, filter, sort and compare refurbished laptops
- See the exact condition grade (A+, A, B, C), measured battery health and warranty of every unit
- Save laptops to a wishlist, add them to a cart, apply coupons
- Check out as a guest or with an account, and pay online (Razorpay: UPI, cards, net banking, wallets) or by cash on delivery
- Get an order confirmation, track the order, manage addresses and see order history
- Contact the business by phone, WhatsApp, email or contact form, and request a trade-in quote

Staff can:

- Manage products, photos, specifications, prices, stock, coupons, orders, customers and reviews in the **admin panel** (`/admin`)
- Edit all marketing content — homepage, blog, FAQs, policies, contact details — in the **CMS** (`/keystatic`)

## Feature list

| Area | Features |
| --- | --- |
| Catalogue | Listing with 13 filters (brand, price, processor, generation, RAM, storage, SSD, screen, GPU, OS, condition, warranty, availability), 6 sort orders, pagination, shareable filter URLs |
| Search | Header search with live suggestions (products, brands, categories), keyboard navigation |
| Product page | Image gallery (zoom, fullscreen, swipe), grade explainer, specifications, condition details, battery meter, what's included, warranty/shipping/returns, reviews, FAQs, related laptops, sticky mobile "Add to cart / Buy now" bar |
| Shopping | Quick view, wishlist (device or account), compare up to 4, cart drawer, save for later, coupons |
| Checkout | 5 steps (contact → address → delivery → payment → review), saved addresses, live totals, Razorpay or COD |
| After purchase | Confirmation page, retry payment, public order tracking, account order history with timeline |
| Accounts | Register, sign in, forgot/reset password, profile, password, addresses, support |
| Content | Homepage sections, 6 blog guides, 7 policy pages, 16 FAQs, 11 SEO landing pages, "How we refurbish", condition grades, contact, trade-in |
| Admin | Dashboard with charts, products, inventory, orders, customers, coupons, reviews, brands & categories, settings & shipping zones, inbox |
| SEO | Unique titles and descriptions, canonical URLs, Open Graph, structured data, sitemap, robots, clean URLs |
| Other | WhatsApp button, analytics hooks (GA4, GTM, Meta Pixel), installable web app (PWA manifest), toast notifications, loading skeletons, error and 404 pages |

## Technology

| Concern | Technology | Why |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router) | Server rendering for speed and SEO; Server Actions for forms |
| Language | **TypeScript** (strict) | Catches mistakes before they reach customers |
| Styling | **Tailwind CSS v4** + shadcn-style components on **Radix UI** | Consistent design; accessible dialogs, menus and forms |
| Database | **PostgreSQL** via **Prisma 7** | Reliable transactions for orders, stock and payments |
| Content | **Keystatic** CMS | Content stored as files in Git — versioned, free, no extra server |
| Forms | **React Hook Form** + **Zod** | Same validation rules in the browser and on the server |
| Animation | **Framer Motion** | Subtle transitions; respects "reduce motion" settings |
| Payments | **Razorpay** (REST API + Checkout.js) | Indian payment methods; no SDK needed |
| Images | **next/image**, Cloudinary-ready | Automatic WebP/AVIF, responsive sizes |
| Email | **Resend** (optional) | Order confirmations, password resets |
| Hosting | **Vercel** + **Neon** | Free tiers available; automatic deploys from GitHub |

Authentication, rate limiting, charts and state management are small in-house modules — no extra paid services or heavy libraries.

## Folder structure

```
RenewByte/
├─ content/                 CMS content (YAML + Markdoc files) — edited via /keystatic
│  ├─ settings/             site details, announcement bar, navigation, footer, grades, refurbish steps
│  ├─ home.yaml             homepage text
│  ├─ blog/  pages/  landing/  faqs/  testimonials/  banners/
├─ docs/                    this documentation
├─ prisma/
│  ├─ schema.prisma         database structure
│  ├─ migrations/           SQL that creates/updates the tables
│  ├─ seed.ts, seed-data.ts demo data + first admin
├─ public/                  images, icons
├─ scripts/                 generate-images.mjs, create-admin.ts
├─ src/
│  ├─ proxy.ts              first-line protection for /admin, /account, /keystatic
│  ├─ app/                  every page and API route (see 11-reference.md)
│  │  ├─ (store)/           the customer-facing shop (shared header and footer)
│  │  ├─ admin/             the admin panel
│  │  ├─ keystatic/         the CMS screen
│  │  ├─ api/               search, payments, cron, CMS, admin endpoints
│  │  └─ actions/           Server Actions (form and button handlers)
│  ├─ components/           reusable UI pieces grouped by area
│  ├─ lib/                  shared helpers (database, auth, CMS reader, formatting, SEO…)
│  ├─ server/               business logic (catalogue, cart, pricing, coupons, shipping, stock, orders, payments, email)
│  └─ generated/prisma/     auto-generated database client (not committed)
├─ keystatic.config.ts      CMS content model
├─ next.config.ts           Next.js settings (images, security headers, file bundling)
├─ prisma.config.ts         Prisma settings
├─ vercel.json              daily cron job
├─ docker-compose.yml       local database
└─ .github/workflows/       optional 15-minute stock-release schedule
```

## Design principles

- **Trust first.** Condition grade, battery health and warranty are shown on every card and product page. No invented reviews; sample testimonials are labelled.
- **Prices are exact.** Money is stored in paise (whole numbers), and the server always recalculates totals — the browser never decides a price.
- **One source of truth.** Shop data lives in the database; marketing words live in the CMS. Nothing is stored twice.
- **Fast and accessible.** Pages render on the server, images are optimised, every control works with a keyboard, and layouts are tested down to 320 px wide.
