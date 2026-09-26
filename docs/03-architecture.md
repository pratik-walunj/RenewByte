# 03 — Architecture

## The big picture

```
                 ┌──────────────────────────── Browser ────────────────────────────┐
                 │  Pages (HTML from server)   Client components (cart, filters…)   │
                 └───────────────┬───────────────────────────────┬─────────────────┘
                                 │ page requests                 │ Server Actions / fetch
                 ┌───────────────▼───────────────────────────────▼─────────────────┐
                 │                         Next.js server                           │
                 │  src/proxy.ts  → quick login check for /admin /account /keystatic │
                 │  src/app/**    → pages, layouts, API routes, Server Actions       │
                 │  src/server/** → business rules (catalogue, cart, orders, stock…)│
                 │  src/lib/**    → helpers (db, auth, CMS reader, SEO, formatting)  │
                 └──────┬──────────────────────┬──────────────────────┬─────────────┘
                        │ Prisma               │ file reads           │ HTTPS
                 ┌──────▼──────┐        ┌──────▼──────┐        ┌──────▼──────────────┐
                 │ PostgreSQL  │        │  content/   │        │ Razorpay, Resend,   │
                 │ (shop data) │        │ (CMS files) │        │ Cloudinary          │
                 └─────────────┘        └─────────────┘        └─────────────────────┘
```

## Two stores of data

| PostgreSQL (edited in `/admin`) | Keystatic files in `content/` (edited in `/keystatic`) |
| --- | --- |
| Products, specs, images, prices, stock | Homepage text, hero, trust features |
| Orders, payments, order history | Announcement bar, navigation, footer |
| Customers, sessions, addresses, carts, wishlists | Blog posts, policy and static pages |
| Coupons, reviews, shipping zones, tax/COD settings | FAQs, testimonials, banners |
| Contact messages, trade-in requests, newsletter | Condition-grade definitions, refurbish process |
| | SEO landing-page copy, business contact details, analytics IDs |

Rule: anything a customer transaction depends on lives in the database; anything a marketer writes lives in the CMS.

## Layers in the code

| Layer | Folder | Responsibility |
| --- | --- | --- |
| Routes | `src/app/` | Decide what to show; call server functions; set page metadata |
| Server Actions | `src/app/actions/` | Handle forms and buttons: validate input with Zod, check permissions, call business logic, return `{ ok, … }` |
| Business logic | `src/server/` | The rules: pricing, coupons, shipping, stock, orders, payments. Never trusts browser input |
| Helpers | `src/lib/` | Database client, sessions, CMS reader, filters, formatting, SEO, rate limiting |
| UI | `src/components/` | Reusable pieces (`ui/` primitives, `product/`, `cart/`, `checkout/`, `admin/`…) |

## Rendering strategy

| Page type | How it renders |
| --- | --- |
| Content pages (about, policies, FAQ, blog, grades…) | **Pre-built** at deploy time from CMS files — instant |
| Catalogue, product, brand, category, deals, homepage | **Rendered per request** on the server, using **cached database queries** (5-minute cache, cleared immediately when admin changes something) |
| Cart, wishlist, compare | Page shell is static; contents load in the browser from the user's cart/wishlist |
| Account, checkout, order, admin | Rendered per request for the signed-in user; never cached or indexed |

Caching lives in `src/lib/cache.ts` (`cached()` wrapper and `invalidateCatalog()`); catalogue queries are in `src/server/catalog.ts`.

### Why 404s and redirects return correct status codes

Pages decide "not found" or "redirect" **before** anything streams to the browser, and loading skeletons are only used where they can't hide a 404 (the laptop listing, and the product body behind a `Suspense` boundary). This keeps search engines from seeing "soft 404s".

## Client-side state

`src/components/providers/store-provider.tsx` holds, in one React context:

- the signed-in user (name, email, staff or not)
- the cart (always fetched from the server — server is the source of truth)
- the wishlist (in the browser for guests; in the database for signed-in users, merged on sign-in)
- the compare list (in the browser, max 4)

It loads everything with one call (`bootstrapStore`) after the page appears, so pages themselves stay cacheable.

## Key flows

### Browsing with filters

1. URL like `/laptops?brand=dell&ram=16gb` is parsed by `parseFilters()` (`src/lib/filters.ts`).
2. `listProducts()` builds a database query; `getFacets()` returns filter options with counts.
3. Clicking a filter updates the URL (shareable) and the server re-renders the results.

### Adding to cart

1. Button → `addToCart` Server Action → checks product is published and in stock.
2. The cart belongs to the signed-in user, or to a guest cookie (`rb_cart`).
3. Returns the full recalculated cart; the drawer opens with the new totals.

### Checkout and payment

See [07 — Orders & payments](07-orders-and-payments.md).

## Important files

| File | Why it matters |
| --- | --- |
| `prisma/schema.prisma` | Every database table |
| `keystatic.config.ts` | Every CMS field |
| `src/server/catalog.ts` | All product queries, filters, search suggestions |
| `src/server/cart.ts` | Cart building and guest/user cart merging |
| `src/server/orders.ts` | Order creation, payment state changes, status workflow, tracking |
| `src/server/inventory.ts` | Stock reservation, deduction, release, restock |
| `src/server/pricing.ts`, `coupons.ts`, `shipping.ts` | Money calculations |
| `src/server/payments/razorpay.ts` | Razorpay API and signature checks |
| `src/lib/auth/session.ts` | Sign-in sessions and role checks |
| `src/lib/cms.ts` | Reading CMS content |
| `src/lib/seo.ts` | Page metadata and structured data helpers |
| `src/proxy.ts` | First-line gate for private areas |
