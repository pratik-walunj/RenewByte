# 06 — Admin guide (running the store)

The admin panel is at **`/admin`**. It works on desktop (sidebar) and phone (menu button at the top left).

## Roles

| Role | Can do |
| --- | --- |
| **ADMIN** | Everything, including store settings, shipping zones, deleting products/coupons/brands, changing user roles, activating/deactivating accounts |
| **STAFF** | Day-to-day work: products, inventory, orders, coupons (create/edit/pause), reviews, inbox, CMS. Settings are read-only |
| **CUSTOMER** | No admin access |

Create or reset an admin from the project folder:

```bash
npm run admin:create -- you@example.com "a-strong-password" "Your Name"
```

For the live site, run it with the production database: in PowerShell first set `$env:DATABASE_URL="<neon connection string>"`.

## Dashboard

Shows total sales, orders, customers, published products, low-stock and out-of-stock counts, pending orders, a 30-day sales tile, revenue-per-day and orders-per-day charts (last 30 days, India time), sales by brand, recent orders and a low-stock list.

## Products

**Products → Add product** opens one form with these sections:

| Section | Notes |
| --- | --- |
| Basics | Name, URL slug (auto-generated, editable), SKU (must be unique), brand, category, status, short and full description |
| Pricing | Enter **MRP** and **selling price in rupees**. The discount % is calculated automatically |
| Condition & warranty | Grade A+/A/B/C, warranty months, battery health %, typical backup |
| Specifications | Processor (full name, brand, family such as "Core i5", generation), RAM, storage, display, graphics (integrated/dedicated), OS, weight, colour, keyboard |
| Lists | Highlights, features, ports, what's included |
| Extra specification rows | Any additional label/value pairs |
| Images | Add by URL or upload (when Cloudinary is configured). Reorder with the arrows. **Alt text is required** |
| Merchandising | Featured, best seller, deal (+ deal end date — shows a countdown) |
| Inventory | Starting quantity and low-stock threshold (new products) |
| SEO | Title and description with character counters |

Tips:

- The **processor family** (e.g. "Core i5", "Ryzen 5", "Apple M1") and **generation** (e.g. "11th Gen") power the shop filters — keep them consistent.
- A product needs **at least one image** before it can be published.
- **Status:** Draft = hidden; Published = live; Archived = hidden and kept for order history.
- **Duplicate** copies a product as a draft with a new slug/SKU and zero stock — handy for several units of the same model.
- **Delete** (admin only) archives the product instead if it appears in past orders.
- Every change updates the live shop immediately.

## Inventory

Shows SKU, on hand, reserved, available (= on hand − reserved), threshold and status (In stock / Low stock / Out of stock). Filter by status or search.

**Adjust** lets you set a new quantity or add/remove units. A **reason is required** (e.g. "New batch received", "Damaged unit"). You can't go below the number currently reserved by unpaid online orders. Every change is logged under **Recent adjustments** with your name.

## Orders

The list can be filtered by status (use **Needs action** for orders waiting on you) and searched by order number, email, phone or name.

The order page shows items, totals, coupon, customer, delivery address, payment attempts and the full status history. The **status form** only offers valid next steps, and lets you add a note, courier name and tracking number (shown to the customer).

Typical flow:

| Order type | Steps |
| --- | --- |
| Paid online | PAID → PROCESSING → PACKED → SHIPPED (add courier + tracking) → OUT_FOR_DELIVERY → DELIVERED |
| Cash on delivery | PROCESSING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED (payment is marked collected on delivery) |

Cancelling or refunding returns the stock automatically. For online refunds, issue the refund in the **Razorpay dashboard** first; the webhook then marks the order REFUNDED (or set it manually).

## Customers

List with number of orders and lifetime value; detail page with profile, addresses and orders. **Admins** can change a user's role and activate/deactivate accounts (never their own). Changing role or deactivating signs that user out everywhere.

## Coupons

Create **percentage** or **fixed** discounts with:

- minimum order value and maximum discount
- start and expiry dates (India time; ends at 23:59 on the expiry day)
- total usage limit and per-customer limit
- optional restriction to specific products or categories (leave empty for the whole cart)

Codes are saved in capitals and must be unique. **Pause** a coupon with the active switch. A coupon that has already been used is deactivated rather than deleted, to keep order history intact.

## Reviews

Customers can review once per product after signing in; purchases are marked "Verified purchase". New reviews wait in **Pending**. **Approve** to publish, **Reject** to hide, or delete. The product's star rating updates automatically.

## Brands & categories

Create and edit brands and categories (name, slug, description, logo/image, active, sort order, SEO). Deleting is blocked while products use them. The slug is the page address: `/brand/dell`, `/category/gaming-laptops`.

## Settings (admin only)

| Setting | Meaning |
| --- | --- |
| Tax rate & "prices include tax" | Default 18% GST included in prices. The GST part is shown in the order summary |
| Free-shipping threshold / flat fee | 0 threshold + 0 fee = always free standard delivery |
| Express delivery | On/off and fee |
| Cash on delivery | On/off, optional fee and maximum order value |
| Razorpay enabled | Turn online payment off without removing keys |
| Low-stock threshold | Default for new products |
| **Shipping zones** | Different fees and delivery times for listed states or PIN-code prefixes (e.g. North-East, metros) |

The **Integrations** card shows whether Razorpay, Cloudinary and email are configured (never the secret values). The **Business & brand** card shows the contact details from the CMS with an "Edit in CMS" button — those details are edited only in the CMS so there is one source of truth.

## Inbox

Contact form messages and trade-in requests, each with status New / In progress / Resolved. Newsletter subscribers with **Export CSV**.
