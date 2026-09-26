# 08 — Deployment (Vercel + Neon)

Current production set-up:

| Piece | Service | Plan |
| --- | --- | --- |
| Website | Vercel project `renew-byte` → https://renew-byte.vercel.app | Hobby (free) |
| Code | GitHub `pratik-walunj/RenewByte`, branch `main` | — |
| Database | Neon PostgreSQL, Asia Pacific (Singapore) | Free |

Every push to `main` deploys automatically.

## 1. Database (Neon)

1. https://neon.tech → **Create project** → region **Asia Pacific (Singapore)**.
2. **Connect** → enable **Connection pooling** → copy the connection string (host contains `-pooler`).
3. From the project folder (PowerShell), create the tables and first data:

```powershell
$env:DATABASE_URL="postgresql://...-pooler...neon.tech/neondb?sslmode=require&channel_binding=require"
npx prisma migrate deploy
npx prisma db seed                      # demo data + admin (optional)
npm run admin:create -- you@example.com "strong-password" "Your Name"
```

> The production database has already been created and seeded. Use `migrate deploy` again only after adding new migrations.

## 2. Environment variables (Vercel)

**Vercel → project → Settings → Environment Variables.**

| Name | Type | Value |
| --- | --- | --- |
| `DATABASE_URL` | Secret | Neon pooled connection string |
| `AUTH_SECRET` | Secret | 32+ random characters |
| `CRON_SECRET` | Secret | random string |
| `NEXT_PUBLIC_SITE_URL` | **Config** | `https://renew-byte.vercel.app` (or your custom domain) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Secret | from Razorpay |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Config | Razorpay key id |
| `RESEND_API_KEY` | Secret | optional |
| `EMAIL_FROM` | Config | e.g. `RenewByte <orders@yourdomain.in>` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Secret | optional |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Config | optional |

Rules learned the hard way:

- **No quotes** around values in Vercel (`https://…`, not `"https://…"`).
- Names starting with **`NEXT_PUBLIC_` must be type Config**, not Secret. A saved Secret can't be changed to Config — delete it and add it again.
- Tick **Production** (and Preview) for each variable.
- After changing variables, **Deployments → ⋯ → Redeploy**. `NEXT_PUBLIC_` values are baked in at build time.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` are only for the seed script — they don't belong in Vercel.

A git-ignored helper file `.env.vercel` in the project root holds the production values prepared for pasting.

## 3. Build settings

Vercel detects Next.js automatically. `npm install` runs `prisma generate` via the `postinstall` script.

To run new database migrations on every deploy, set **Settings → Build & Deployment → Build Command** to:

```
prisma migrate deploy && next build
```

(Only if `DATABASE_URL` is available at build time — otherwise run `npx prisma migrate deploy` manually after merging a migration.)

## 4. Cron jobs (free plan)

Vercel Hobby only allows **daily** cron jobs, so `vercel.json` runs `/api/cron/release-reservations` once a day at 03:00 UTC. Abandoned-payment stock is also released automatically during checkout and add-to-cart, and an optional GitHub Action can run it every 15 minutes (see [07](07-orders-and-payments.md#stock-release-abandoned-payments)).

## 5. Custom domain

1. Vercel → **Settings → Domains → Add** (e.g. `renewbyte.in`) and follow the DNS instructions.
2. Change `NEXT_PUBLIC_SITE_URL` to the new domain, redeploy.
3. Update the Razorpay webhook URL and (if used) the Keystatic GitHub App callback URL.
4. Re-submit the sitemap in Google Search Console.

## 6. After each deploy — quick checks

- Homepage, `/laptops` and one product page load
- `/sitemap.xml` lists products
- Sign in to `/admin`
- Place a test order (COD, or Razorpay test mode) and see it in **Admin → Orders**

## Other hosts

Any Node.js 20.9+ server works: `npm ci && npm run build && npm start`. With a persistent disk, the CMS can stay in local mode.
