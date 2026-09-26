# 07 — Orders & payments

## Checkout steps (customer view)

1. **Contact** — name, email, 10-digit Indian mobile
2. **Address** — house/street, area, landmark, PIN code, city, state (signed-in customers can pick a saved address)
3. **Delivery** — Standard (free by default) or Express (paid), with day estimates from shipping zones
4. **Payment** — Pay online (Razorpay) or Cash on delivery
5. **Review** — optional notes, then **Pay ₹…** / **Place order**

The order summary updates live as the address, delivery or payment method changes. If Razorpay isn't configured, cash on delivery is selected automatically.

## What the server does (never trusts the browser)

1. Re-reads every cart item from the database: still published? enough stock?
2. Re-validates the coupon (dates, limits, minimum order, product/category scope).
3. Calculates shipping from store settings and shipping zones.
4. Calculates GST and the total.
5. Creates the order with a snapshot of items and address.
6. **Online:** reserves the stock, creates a Razorpay order for the exact amount, returns it to the browser.
   **COD:** deducts stock immediately, records the coupon use, empties the cart, emails the confirmation.

## Online payment (Razorpay)

```
Browser                         RenewByte server                      Razorpay
  │ Place order ───────────────▶ create order, reserve stock
  │                              create Razorpay order ─────────────▶
  │ ◀── razorpay order id ───────
  │ Checkout.js popup ─────────────────────────────────────────────▶ customer pays
  │ ◀── payment id + signature ────────────────────────────────────
  │ POST /api/payments/razorpay/verify ─▶ check HMAC signature
  │                                      fetch payment from Razorpay ─▶ confirm "captured" + amount
  │                                      mark PAID, commit stock, email
  │ ◀── ok → confirmation page
  │                              ◀── webhook payment.captured (backup, idempotent)
```

- A **fake success** from the browser is rejected: the signature must match, and the payment must really be captured for the right amount.
- If the customer closes the tab after paying, the **webhook** completes the order.
- If payment **fails or is dismissed**, the order stays reserved for 30 minutes; the confirmation page offers **Retry payment**.
- Unpaid orders older than 30 minutes are **cancelled** and their stock released (see "Stock release" below).
- A payment that arrives after cancellation is recorded and the order is flagged "refund required" in its history.

### Setting up Razorpay

1. Create an account at https://dashboard.razorpay.com and start in **Test mode**.
2. **Account & Settings → API Keys → Generate key.**
3. In Vercel (and `.env` locally) add:
   - `RAZORPAY_KEY_ID` (Secret) and `RAZORPAY_KEY_SECRET` (Secret)
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (Config) — same value as the key id
4. **Account & Settings → Webhooks → Add new webhook**
   - URL: `https://renew-byte.vercel.app/api/payments/razorpay/webhook`
   - Secret: any strong random string → also save it as `RAZORPAY_WEBHOOK_SECRET` (Secret) in Vercel
   - Events: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`
5. **Account & Settings → Payment capture → Automatic.**
6. Redeploy. Test with Razorpay's test cards/UPI, then repeat steps 2–4 with **Live mode** keys when ready.

## Cash on delivery

Controlled in **Admin → Settings**: on/off, optional COD fee, optional maximum order value. COD orders start at **PROCESSING**; payment is marked collected when the order is set to **DELIVERED**.

## Order statuses

| Status | Meaning | Customer timeline |
| --- | --- | --- |
| PENDING | Order created | Order placed |
| PAYMENT_PROCESSING | Waiting for online payment | Order placed |
| PAID | Online payment confirmed | Payment confirmed |
| PROCESSING | Being prepared (COD orders start here) | Processing |
| PACKED | Packed | Packed |
| SHIPPED | Handed to courier | Shipped (+ courier & tracking) |
| OUT_FOR_DELIVERY | With delivery agent | Out for delivery |
| DELIVERED | Delivered | Delivered |
| CANCELLED | Cancelled — stock returned | Cancelled banner |
| REFUNDED | Refunded — stock returned | Refunded banner |

Only valid moves are offered in the admin (e.g. you can't go from DELIVERED back to PACKED).

## Coupons

Validated on the server when applied **and again** when the order is placed. Limits count real orders: a coupon is "used" when a COD order is placed or an online payment is confirmed.

## Tax and shipping

- Prices include 18% GST by default; the summary shows "Includes ₹X GST". Switch off "prices include tax" to add GST on top.
- Shipping: free-shipping threshold, flat fee, express fee and zone overrides (by state or PIN prefix) — all in **Admin → Settings**. The code (`src/server/shipping.ts`) is ready to plug in a courier API such as Shiprocket later.

## Stock release (abandoned payments)

Unpaid online orders hold stock for 30 minutes. They are released by:

1. **Automatically during shopping** — checkout and add-to-cart run the clean-up at most every 5 minutes.
2. **Daily Vercel cron** at 03:00 UTC (`vercel.json`) — allowed on the free Hobby plan.
3. **Optional GitHub Action** every 15 minutes (`.github/workflows/release-reservations.yml`) — add repository secrets `SITE_URL` and `CRON_SECRET`.

All three call the same protected endpoint `/api/cron/release-reservations` (requires `Authorization: Bearer <CRON_SECRET>`).

## Emails

Order confirmations and password resets are sent through Resend when `RESEND_API_KEY` and `EMAIL_FROM` are set (verify your domain in Resend first). Without a key, the email text is printed in the server log instead — checkout still works.

## Order access for guests

Guests get a private link `/order/RB-…?token=…` (also in the confirmation email). Anyone can also use `/track-order` with the order number plus the email or phone used — it never reveals whether an order number exists if the contact doesn't match.
