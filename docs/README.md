# RenewByte documentation

RenewByte is an online store for professionally refurbished laptops in India. This folder is the complete manual for running, changing and deploying it.

## Who should read what

| You want to… | Read |
| --- | --- |
| Understand what the project is and how it's organised | [01 — Overview](01-overview.md) |
| Run it on your computer | [02 — Getting started](02-getting-started.md) |
| Understand how the code fits together | [03 — Architecture](03-architecture.md) |
| Understand the database tables and data rules | [04 — Database](04-database.md) |
| Edit homepage text, blog posts, FAQs, policies, contact details | [05 — CMS guide](05-cms-guide.md) |
| Manage products, stock, orders, coupons, reviews (day-to-day store work) | [06 — Admin guide](06-admin-guide.md) |
| Understand checkout, Razorpay, cash on delivery and order statuses | [07 — Orders & payments](07-orders-and-payments.md) |
| Put the site online (Vercel + Neon) | [08 — Deployment](08-deployment.md) |
| Understand search-engine and analytics set-up | [09 — SEO & analytics](09-seo-and-analytics.md) |
| Understand how the site is protected | [10 — Security](10-security.md) |
| Look up every page, API route and server action | [11 — Reference](11-reference.md) |
| Fix a problem | [12 — Troubleshooting](12-troubleshooting.md) |

## Quick facts

| | |
| --- | --- |
| Live site | https://renew-byte.vercel.app |
| Source code | https://github.com/pratik-walunj/RenewByte (branch `main`) |
| Admin panel | `/admin` |
| Content editor (CMS) | `/keystatic` |
| Production database | Neon PostgreSQL (Singapore region) |
| Local database | Docker container on `localhost:5440` |
| Business contact | +91 8576000084 (phone & WhatsApp), Pune, Maharashtra |

## Before going live — checklist

- [ ] Replace the 24 **demo products** (marked "Demo listing") with real stock and real photos.
- [ ] Have a lawyer review the **policy pages** (warranty, returns, shipping, privacy, terms). They contain placeholder terms such as a 7-day return window — confirm or change them.
- [ ] Replace or delete the 3 **sample testimonials** (they show a "Sample" label).
- [ ] Add the real **support email**, street address, PIN code and GSTIN in CMS → Site settings.
- [ ] Add **Razorpay live keys** and the webhook (see [07](07-orders-and-payments.md)).
- [ ] Change the **admin password** and rotate the Neon database password (see [10](10-security.md)).
- [ ] Add analytics IDs and submit the sitemap to Google Search Console (see [09](09-seo-and-analytics.md)).
