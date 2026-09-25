"use client";

import type { RazorpayCheckoutData } from "@/app/actions/checkout";

type RazorpaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayFailure = {
  error: { code?: string; description?: string; metadata?: { order_id?: string; payment_id?: string } };
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: "payment.failed", cb: (res: RazorpayFailure) => void) => void;
    };
  }
}

let loader: Promise<void> | null = null;

export function loadRazorpay() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Razorpay) return Promise.resolve();
  loader ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loader = null;
      reject(new Error("Could not load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return loader;
}

export type PaymentOutcome =
  | { status: "paid" }
  | { status: "pending" }
  | { status: "failed"; message: string }
  | { status: "dismissed" };

/**
 * Opens Razorpay Checkout and resolves once the attempt finishes. Success is
 * only reported after the server verifies the signature and payment status.
 */
export async function payWithRazorpay(data: RazorpayCheckoutData): Promise<PaymentOutcome> {
  await loadRazorpay();
  return new Promise<PaymentOutcome>((resolve) => {
    let settled = false;
    const finish = (o: PaymentOutcome) => {
      if (!settled) {
        settled = true;
        resolve(o);
      }
    };

    const rzp = new window.Razorpay!({
      key: data.keyId,
      order_id: data.razorpayOrderId,
      amount: data.amount,
      currency: data.currency,
      name: data.businessName,
      description: data.description,
      prefill: data.prefill,
      theme: { color: "#111827" },
      modal: { ondismiss: () => finish({ status: "dismissed" }), confirm_close: true },
      handler: async (res: RazorpaySuccess) => {
        try {
          const r = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res),
          });
          const body = (await r.json()) as { ok: boolean; pending?: boolean; error?: string };
          if (body.ok) finish(body.pending ? { status: "pending" } : { status: "paid" });
          else finish({ status: "failed", message: body.error ?? "Payment verification failed." });
        } catch {
          finish({ status: "pending" });
        }
      },
    });

    rzp.on("payment.failed", (res) => {
      void fetch("/api/payments/razorpay/failure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: res.error.metadata?.order_id ?? data.razorpayOrderId,
          razorpay_payment_id: res.error.metadata?.payment_id ?? null,
          code: res.error.code ?? null,
          description: res.error.description ?? null,
        }),
      }).catch(() => undefined);
      // Razorpay keeps its modal open so the customer can retry; we only record the attempt.
    });

    rzp.open();
  });
}
