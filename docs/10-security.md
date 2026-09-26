# 10 — Security

## How it's protected

| Area | Protection |
| --- | --- |
| Passwords | scrypt hashing with a random salt; minimum 10 characters. Sign-in takes the same time whether or not the email exists |
| Sessions | Random token in an `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookie. The database stores only an HMAC of the token (keyed by `AUTH_SECRET`), so a database leak can't be turned into a login. 30-day expiry |
| Password reset | One-hour, single-use links; older links stop working when a new one is sent; all other sessions are signed out after a reset or password change |
| Private areas | `src/proxy.ts` sends visitors without a session to sign-in; **every** admin page, Server Action and API route then re-checks the session and role itself |
| Roles | ADMIN-only: settings, shipping zones, deletions, role and account changes. Admins can't deactivate or demote themselves |
| Input | Every Server Action and API route validates input with Zod on the server; free text is cleaned of control characters |
| CSRF | Server Actions have built-in origin checks; JSON routes (`/api/payments/*`, Cloudinary signing) require a same-origin request |
| Rate limits | Sign-in, register, password reset, checkout, coupons, search, reviews, contact/trade-in/newsletter forms, order tracking, cart |
| Payments | Razorpay signatures verified with HMAC; payment status and amount re-fetched from Razorpay; webhooks verified and de-duplicated |
| Prices | Always recalculated on the server from the database |
| Secrets | Only in environment variables; never sent to the browser. The admin "Integrations" card shows configured / not set only |
| Headers | `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`; private areas also send `X-Robots-Tag: noindex` |
| Structured data | JSON-LD output is escaped so content can't break out of the script tag |
| Order privacy | Guest order pages need a random token; public tracking shows no street address, email or phone |

## Things you must do

1. **Rotate the Neon database password.** It was shared in a chat during setup. Neon → your project → **Roles** → `neondb_owner` → **Reset password** → update `DATABASE_URL` in Vercel and in `.env.vercel` → Redeploy.
2. **Change the admin account** to your real email and a password only you know:
   ```powershell
   $env:DATABASE_URL="<neon connection string>"
   npm run admin:create -- you@yourmail.com "new-strong-password" "Your Name"
   ```
   Then sign in with it and deactivate `admin@example.com` in **Admin → Customers**.
3. Keep `.env` and `.env.vercel` private — both are git-ignored. Never paste secrets into issues or chats.
4. Use **Razorpay test mode** until you have checked a full order, then switch to live keys.

## Known limits

- **Rate limits are per server instance** (in memory). On Vercel several instances may run, so limits are softer. For stronger limits, replace the store in `src/lib/rate-limit.ts` with Redis (for example Upstash) — the call sites stay the same.
- There is **no email verification** on sign-up; a customer can register any email address.
- A guest who later registers doesn't automatically see their earlier guest orders in the account (they can still use the order link or `/track-order`).

## Reporting a problem

If you suspect a breach: rotate `AUTH_SECRET` (signs everyone out), rotate the database password and Razorpay keys, then check **Admin → Customers** for unexpected staff/admin accounts.
