# 02 — Getting started (local computer)

## Requirements

| Tool | Version | Check with |
| --- | --- | --- |
| Node.js | 20.9 or newer (developed on 24) | `node -v` |
| npm | 10+ | `npm -v` |
| Docker Desktop | any recent | `docker --version` |
| Git | any | `git --version` |

## First-time setup

```bash
git clone https://github.com/pratik-walunj/RenewByte.git
cd RenewByte
npm install            # installs packages and generates the database client
cp .env.example .env   # then open .env and fill in AUTH_SECRET and ADMIN_PASSWORD
npm run db:up          # starts PostgreSQL in Docker on localhost:5440
npm run db:deploy      # creates the tables
npm run db:seed        # adds 24 demo laptops, coupons, shipping zones and the admin user
npm run dev            # starts the site
```

Open:

| URL | What |
| --- | --- |
| http://localhost:3000 | The shop |
| http://localhost:3000/admin | Admin panel (sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`) |
| http://localhost:3000/keystatic | Content editor (sign in as admin first) |

> **Port 5440:** the local database uses port 5440 because 5433 was already used by another project on this computer. If 5440 is also busy, change it in both `docker-compose.yml` and `DATABASE_URL` in `.env`.

### Generating secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Use the output for `AUTH_SECRET` (and a second run for `CRON_SECRET`).

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the site with live reload |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Run the production build |
| `npm run lint` | Check code style and React rules |
| `npm run typecheck` | Check TypeScript types |
| `npm run db:up` | Start the local database container |
| `npm run db:migrate` | After editing `schema.prisma`: create and apply a new migration |
| `npm run db:deploy` | Apply existing migrations (used in production) |
| `npm run db:seed` | Load demo data (safe to run again) |
| `npm run db:studio` | Browse the database in a web UI |
| `npm run db:reset` | **Delete everything** and rebuild the local tables (then run `db:seed`) |
| `npm run admin:create -- email "password" "Name"` | Create an admin or reset an admin password |
| `npm run images:generate` | Re-create the demo laptop images |

## Environment variables

`.env` is never committed to Git. The full annotated list is in `.env.example`.

| Variable | Needed | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Always | Database connection |
| `NEXT_PUBLIC_SITE_URL` | Always | The site's own address (canonical links, emails) |
| `AUTH_SECRET` | Production | Protects sign-in sessions (32+ random characters) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Seeding | First admin account |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Online payments | See [07](07-orders-and-payments.md) |
| `CLOUDINARY_*`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Optional | Photo uploads from admin |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_EMAIL` | Optional | Backups if the CMS fields are empty |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional | Analytics & Search Console |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional | Sending emails (otherwise printed in the server console) |
| `NEXT_PUBLIC_KEYSTATIC_STORAGE` and `KEYSTATIC_*` | Production CMS | See [05](05-cms-guide.md) |
| `CRON_SECRET` | Production | Protects the stock-release job |

Variables starting with `NEXT_PUBLIC_` are visible in the browser — never put secrets in them.

## Demo data

`npm run db:seed` creates:

- 8 brands and 8 categories
- 24 demo laptops (Dell, HP, Lenovo, Apple, Acer, Asus) with realistic specifications, 4 images each, stock and specification rows. Each is flagged `isDemo` and shows a "Demo listing" notice.
- Coupons: `WELCOME500` (₹500 off orders above ₹20,000, once per customer) and `STUDENT5` (5% off student laptops, max ₹1,500)
- 2 shipping zones (North-East & islands; metro PIN prefixes)
- Store settings with defaults
- The admin user from `.env`

No reviews or orders are generated — reviews must come from real customers.
