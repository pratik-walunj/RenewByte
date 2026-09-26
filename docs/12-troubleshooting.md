# 12 — Troubleshooting

Problems already met on this project, with their fixes, plus common ones.

## "This page didn't load properly" (live site)

The page hit a server error. The number under the message is a reference.

1. Vercel → project → **Logs** → search for the reference number.
2. Most common causes:

| Log says | Fix |
| --- | --- |
| `Authentication failed against the database server` / `Can't reach database server` | `DATABASE_URL` is missing, wrong, or points at `localhost`. Set the Neon pooled string in Vercel (no quotes) and redeploy |
| `The table … does not exist` | Tables not created: run `npx prisma migrate deploy` with the production `DATABASE_URL` |
| `AUTH_SECRET must be set` | Add `AUTH_SECRET` (32+ characters) in Vercel and redeploy |

## Menu links / announcement bar missing on the live site

The CMS files weren't bundled with the server. Fixed in `next.config.ts` with `outputFileTracingIncludes` for `./content/**/*`. If it happens again after moving files, check that setting.

## `Authentication failed … credentials for renewbyte are not valid` (local)

Another program already uses the database port. On this computer port 5433 belonged to another project's container, so RenewByte uses **5440**. Check with:

```powershell
Get-NetTCPConnection -LocalPort 5440 -State Listen
docker ps
```

Change the port in `docker-compose.yml` and `.env` if needed, then `npm run db:up`, `npm run db:deploy`, `npm run db:seed`, and restart `npm run dev`.

## Vercel: "Hobby accounts are limited to daily cron jobs"

`vercel.json` must use a daily schedule (it now uses `0 3 * * *`). See [07 → Stock release](07-orders-and-payments.md#stock-release-abandoned-payments).

## Vercel: "A variable with the name … already exists"

The variable was imported earlier. Edit the existing one (**⋯ → Edit**) instead of adding a new one.

## Vercel: "Remove the public framework prefix to keep this value private…"

`NEXT_PUBLIC_…` variables must be type **Config**. Delete the Secret version and add it again as Config.

## Changes to Vercel variables don't show up

Redeploy after changing variables (**Deployments → ⋯ → Redeploy**). Also make sure the value has no surrounding quotes and that **Production** is ticked.

## CMS edits on the live site don't save

In local mode Keystatic writes files, which Vercel doesn't allow. Edit locally and push, or switch to GitHub mode ([05](05-cms-guide.md#switching-the-live-site-to-github-mode-edit-online)).

## Admin sign-in "does nothing" / returns to the sign-in page

- Wrong email or password → a red message appears. Reset with `npm run admin:create -- email "new-password"` (with the right `DATABASE_URL`).
- Account deactivated → an admin must re-activate it in **Admin → Customers**.
- Local production test over plain `http://` on a non-localhost address → the `Secure` cookie is refused by the browser. Use `localhost` or HTTPS.

## Products don't appear in the shop

- Status must be **Published** (and it needs at least one image).
- Brand and category must be **active**.
- Out-of-stock products still show (marked "Out of stock") unless the customer filters "In stock only".

## Online payment option is greyed out

Razorpay keys aren't set, or **Admin → Settings → Razorpay enabled** is off. Cash on delivery is used automatically meanwhile.

## Order stuck in "Payment processing"

The customer didn't finish paying. It is cancelled and its stock released after 30 minutes (at the next checkout/add-to-cart, daily cron, or GitHub Action). If Razorpay shows the payment as captured, check the webhook set-up — **Razorpay → Webhooks → delivery logs**.

## Emails not arriving

Without `RESEND_API_KEY` emails are only printed in the server log. With Resend, verify the sending domain and set `EMAIL_FROM` to an address on that domain.

## Build fails with "out of memory" (local)

The TypeScript step needs RAM. Close other heavy apps/terminals and run `npm run build` again. Vercel's build machines are not affected.

## `Cannot find module '…/page.js'` in `.next/types` after moving files

Stale generated types. Delete the `.next` folder or just run `npm run build` again.

## Reset everything locally

```bash
npm run db:reset     # deletes all local data and re-applies migrations
npm run db:seed      # reload demo data and the admin user
```
