import "server-only";
import { createHmac } from "node:crypto";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/auth/tokens";

/**
 * Minimal Razorpay REST client (no SDK needed).
 * Docs: https://razorpay.com/docs/api/orders/ and /payments/
 *
 * Flow:
 *   1. Server creates a Razorpay order for the exact server-computed amount.
 *   2. Browser opens Checkout.js with that order id.
 *   3. Browser posts {order_id, payment_id, signature} to /api/payments/razorpay/verify.
 *   4. Server verifies the HMAC signature (and amount) before marking the order paid.
 *   5. Webhooks (payment.captured / payment.failed / refund.processed) reconcile
 *      anything the browser never reported (closed tab, network loss).
 */

const API = "https://api.razorpay.com/v1";

function authHeader() {
  const token = Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString("base64");
  return `Basic ${token}`;
}

export type RazorpayOrder = { id: string; amount: number; currency: string; receipt: string; status: string };

export async function createRazorpayOrder(input: {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (!env.razorpay.configured) throw new Error("Razorpay is not configured.");
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: input.amount, currency: "INR", receipt: input.receipt, notes: input.notes }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("[razorpay] order creation failed", res.status, body.slice(0, 500));
    throw new Error("Could not start the payment. Please try again.");
  }
  return res.json();
}

export type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method?: string;
  error_code?: string | null;
  error_description?: string | null;
};

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  const res = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay payment lookup failed (${res.status})`);
  return res.json();
}

/** Signature sent to the browser handler: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  if (!env.razorpay.keySecret) return false;
  const expected = createHmac("sha256", env.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw request body, webhook_secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  if (!env.razorpay.webhookSecret) return false;
  const expected = createHmac("sha256", env.razorpay.webhookSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
