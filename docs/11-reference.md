# 11 — Reference

## Pages

### Shop (`src/app/(store)/`)

| URL | Page | Notes |
| --- | --- | --- |
| `/` | Homepage | Hero, trust strip, brands, categories, best sellers, banners, deals, why refurbished, process, featured, reviews, guides, FAQ, newsletter |
| `/laptops` | All laptops | Filters, sort, pagination, CMS intro + buying guide |
| `/laptops/[slug]` | Product **or** price landing page | Brand/category aliases redirect (308) |
| `/brand/[slug]` | Brand page | Brand filter locked |
| `/category/[slug]` | Category page | Category filter locked |
| `/deals` | Deals | Countdown to the next deal end |
| `/compare` | Compare up to 4 | noindex |
| `/wishlist` | Wishlist | noindex |
| `/cart` | Cart | Save for later, coupons |
| `/checkout` | Checkout | 5 steps |
| `/order/[id]` | Order confirmation | Needs `?token=` or the owner's session |
| `/track-order` | Public order tracking | Order number + email or phone |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Sign-in pages | |
| `/account` | Dashboard | Signed-in only |
| `/account/orders`, `/account/orders/[id]` | Order history & details | Retry payment if unpaid |
| `/account/addresses`, `/account/profile`, `/account/password`, `/account/support` | Account settings | `/account/wishlist` redirects to `/wishlist` |
| `/blog`, `/blog/[slug]` | Blog | Category filter `?category=` |
| `/about`, `/warranty`, `/returns`, `/shipping`, `/privacy-policy`, `/terms`, `/careers` | CMS pages | |
| `/faq` | All FAQs by topic | |
| `/contact` | Contact details, form, map | |
| `/how-we-refurbish` | 9-step process | |
| `/condition-grades` | Grade comparison | |
| `/sell` | Trade-in request | |

### Admin (`src/app/admin/`)

`/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/inventory`, `/admin/orders`, `/admin/orders/[id]`, `/admin/customers`, `/admin/customers/[id]`, `/admin/coupons`, `/admin/coupons/new`, `/admin/coupons/[id]`, `/admin/reviews`, `/admin/catalog`, `/admin/settings`, `/admin/inbox`

### Other

| URL | What |
| --- | --- |
| `/keystatic` | CMS (staff only) |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | SEO / PWA |

## API routes (`src/app/api/`)

| Route | Method | Auth | Purpose |
| --- | --- | --- | --- |
| `/api/search?q=` | GET | Public, rate-limited | Search suggestions (products, brands, categories) |
| `/api/payments/razorpay/verify` | POST | Same-origin | Verify a completed Razorpay payment |
| `/api/payments/razorpay/failure` | POST | Same-origin | Record a failed attempt (can only mark failed) |
| `/api/payments/razorpay/webhook` | POST | Razorpay signature | Payment captured / failed / refunded |
| `/api/cron/release-reservations` | GET | `Bearer CRON_SECRET` | Cancel unpaid orders > 30 min, free stock |
| `/api/keystatic/[...params]` | GET/POST | Staff | CMS backend |
| `/api/admin/cloudinary/sign` | POST | Staff, same-origin | Sign a direct image upload |
| `/api/admin/newsletter/export` | GET | Staff | Newsletter CSV |

## Server Actions (`src/app/actions/`)

All return `{ ok: true, … }` or `{ ok: false, error, fieldErrors? }` and validate input on the server.

| File | Actions |
| --- | --- |
| `cart.ts` | `fetchCart`, `addToCart`, `updateCartQuantity`, `removeFromCart`, `setSavedForLater`, `applyCoupon`, `removeCoupon` |
| `checkout.ts` | `placeOrder`, `previewCheckout`, `retryPayment` |
| `store.ts` | `bootstrapStore`, `toggleWishlist`, `mergeWishlist`, `fetchProductsByIds`, `fetchProductsBySlugs` |
| `auth.ts` | `login`, `register`, `requestPasswordReset`, `resetPassword`, `signOut`, `signOutAndRedirect` |
| `account.ts` | `updateProfile`, `changePassword`, `saveAddress`, `deleteAddress`, `setDefaultAddress` |
| `reviews.ts` | `submitReview` |
| `content.ts` | `submitContact`, `submitTradeIn`, `subscribeNewsletter` |
| `(store)/track-order/actions.ts` | `trackOrder` |
| `admin/products.ts` | `saveProduct`, `duplicateProduct`, `deleteProduct`*, `setProductStatus`, `toggleProductFlag` |
| `admin/inventory.ts` | `adjustStock` |
| `admin/orders.ts` | `changeOrderStatus` |
| `admin/customers.ts` | `setUserRole`*, `setUserActive`* |
| `admin/coupons.ts` | `saveCoupon`, `setCouponActive`, `deleteCoupon`* |
| `admin/reviews.ts` | `moderateReview`, `deleteReview` |
| `admin/catalog.ts` | `saveTaxonomy`, `deleteTaxonomy`* |
| `admin/settings.ts` | `saveStoreSettings`*, `saveShippingZone`*, `deleteShippingZone`* |
| `admin/inbox.ts` | `setInboxStatus`, `deleteSubscriber`* |
| `admin/session.ts` | `signOutAdmin` |

\* ADMIN role required; all other admin actions require STAFF or ADMIN.

## Catalogue filter parameters

`/laptops?brand=dell,hp&category=business-laptops&min=20000&max=40000&processor=core-i5&gen=11th-gen&ram=16gb&storage=512gb,1tb&ssd=1&screen=14&gpu=dedicated&os=windows-11&condition=a-plus,a&warranty=12&availability=in-stock&deal=1&sort=price-asc&page=2&q=latitude`

| Param | Values |
| --- | --- |
| `brand`, `category` | slugs, comma-separated |
| `min`, `max` | rupees |
| `processor`, `gen` | slugs from the filter list (e.g. `core-i5`, `11th-gen`) |
| `ram`, `storage` | `8gb`, `16gb`, `512gb`, `1tb` … |
| `ssd` | `1` |
| `screen` | `13-and-below`, `14`, `15`, `16-and-above` |
| `gpu` | `integrated`, `dedicated` |
| `os` | `windows-11`, `windows-10`, `macos`, `chromeos`, `linux` |
| `condition` | `a-plus`, `a`, `b`, `c` |
| `warranty` | minimum months (`6`, `12`) |
| `availability` | `in-stock` |
| `deal` | `1` |
| `sort` | `featured`, `newest`, `price-asc`, `price-desc`, `best-selling`, `discount` |
| `page`, `q` | page number, search text |

## Cookies

| Cookie | Purpose | Lifetime |
| --- | --- | --- |
| `rb_session` | Signed-in session | 30 days |
| `rb_cart` | Guest cart | 60 days |

Browser storage: `rb:wishlist` (guest wishlist), `rb:compare` (compare list).

## Cache tags

`catalog`, `brands`, `categories`, `store-settings` — cleared by admin changes through `invalidateCatalog()` / `revalidateTag()` (`src/lib/cache.ts`).
