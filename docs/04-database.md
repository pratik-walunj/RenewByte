# 04 — Database

PostgreSQL, accessed through Prisma 7. The structure is defined in `prisma/schema.prisma`; the SQL that creates it is in `prisma/migrations/`.

## Rules that apply everywhere

- **Money is stored in paise** (integer). ₹34,999 is stored as `3499900`. Display with `formatPrice()`; convert admin input with `rupeesToPaise()`.
- **IDs** are random strings (cuid). Order numbers look like `RB-260925-6B9HQ`.
- Most tables have `createdAt` / `updatedAt` timestamps.
- Orders **copy** product names, prices and the delivery address at purchase time, so later edits never change past orders.

## Tables

### People and sign-in

| Table | Purpose |
| --- | --- |
| `User` | Customers and staff. `role` is `CUSTOMER`, `STAFF` or `ADMIN`. Passwords are scrypt hashes. `isActive=false` blocks sign-in |
| `Session` | One row per signed-in browser. Stores only a keyed hash of the cookie token; expires after 30 days |
| `PasswordResetToken` | One-hour, single-use reset links (hashed) |
| `Address` | Saved delivery addresses (max 10 per customer, one default) |

### Catalogue

| Table | Purpose |
| --- | --- |
| `Brand`, `Category` | Name, slug (URL), description, image/logo, sort order, SEO fields, active flag |
| `Product` | Everything about one listing: name, slug, SKU, brand, category, `mrp` and `price` (paise), `discountPercent`, `conditionGrade` (A_PLUS/A/B/C), warranty months, processor details, RAM, storage, display, graphics, OS, battery health %, weight, colour, keyboard, ports, features, highlights, what's included, flags (featured, best seller, deal + deal end), `status` (DRAFT/PUBLISHED/ARCHIVED), `isDemo`, sales count, rating average/count, SEO fields |
| `ProductImage` | Ordered photos with required alt text (optional Cloudinary id) |
| `ProductSpecification` | Extra spec rows (group, label, value) |

### Stock

| Table | Purpose |
| --- | --- |
| `Inventory` | One row per product: `quantity` (on hand), `reserved` (held by unpaid online orders), `lowStockThreshold`. **Available = quantity − reserved** |
| `InventoryAdjustment` | Audit log of every stock change: amount, reason, order, who did it |

### Shopping

| Table | Purpose |
| --- | --- |
| `Cart` | Belongs to a user **or** a guest cookie token; stores the applied coupon code |
| `CartItem` | Product + quantity; `savedForLater` flag |
| `WishlistItem` | Signed-in customers' saved products |

### Orders and payments

| Table | Purpose |
| --- | --- |
| `Order` | Order number, customer details, address snapshot, status, payment method & status, delivery method, subtotal, discount, shipping, COD fee, tax (GST), total, coupon, courier & tracking number, `stockReserved` flag, `accessToken` for the guest confirmation link |
| `OrderItem` | Snapshot of each product bought (name, SKU, grade, warranty, price, quantity) |
| `OrderStatusEvent` | Timeline of status changes with notes and who made them |
| `Payment` | One row per Razorpay order: provider ids, amount, status, error details |
| `WebhookEvent` | Ids of processed Razorpay webhooks, so a repeat delivery is ignored |

### Promotions and reviews

| Table | Purpose |
| --- | --- |
| `Coupon` | Code, type (PERCENTAGE / FIXED), value, minimum order, maximum discount, start/expiry, total and per-customer limits, active flag, optional product/category restriction |
| `CouponRedemption` | One row per order that used a coupon (for limits) |
| `Review` | Rating 1–5, title, text, `status` (PENDING/APPROVED/REJECTED), verified-purchase flag. Only approved reviews are shown |

### Settings and inbox

| Table | Purpose |
| --- | --- |
| `StoreSettings` | Single row: tax rate (basis points, 1800 = 18%), prices include tax, free-shipping threshold, flat fee, express on/off + fee, COD on/off + fee + max order value, Razorpay on/off, default low-stock threshold |
| `ShippingZone` | Fee and delivery days by state list or PIN-code prefix |
| `ContactMessage`, `TradeInRequest` | Form submissions with status NEW / IN_PROGRESS / RESOLVED |
| `NewsletterSubscriber` | Email sign-ups |

## Stock rules

| Event | What happens |
| --- | --- |
| Online order placed | `reserved += qty` (only if enough is available — checked atomically so two buyers can't get the last unit) |
| Online payment confirmed | `quantity -= qty`, `reserved -= qty`, sales count +qty, adjustment logged |
| Online payment abandoned (30 min) | `reserved -= qty`, order CANCELLED |
| COD order placed | `quantity -= qty` immediately, adjustment logged |
| Order cancelled / refunded by admin | Stock returned (or reservation released), adjustment logged |
| Admin adjustment | Set or change quantity with a required reason; can't go below reserved |

## Changing the database structure

1. Edit `prisma/schema.prisma`.
2. Run `npm run db:migrate` locally and give the migration a name — this creates a new folder in `prisma/migrations/`.
3. Commit the migration folder.
4. Production: run `npm run db:deploy` against the production `DATABASE_URL` (or add `prisma migrate deploy &&` to the Vercel build command).

Never edit an already-applied migration file.

## Backups

Neon keeps point-in-time history on its free plan for a limited window. For extra safety, export periodically:

```bash
pg_dump "$DATABASE_URL" > backup-$(date +%F).sql
```
