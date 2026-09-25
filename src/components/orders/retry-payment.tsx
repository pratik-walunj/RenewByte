"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { retryPayment } from "@/app/actions/checkout";
import { payWithRazorpay } from "@/components/checkout/razorpay-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Outcome = { kind: "idle" } | { kind: "pending" } | { kind: "error"; message: string };

/**
 * Re-opens Razorpay for an unpaid order. Access is checked server-side with
 * either the order's access token or the signed-in owner.
 */
export function RetryPaymentButton({
  orderNumber,
  token,
  label = "Retry payment",
  className,
  size = "lg",
}: {
  orderNumber: string;
  token?: string | null;
  label?: string;
  className?: string;
  size?: "md" | "lg";
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [outcome, setOutcome] = React.useState<Outcome>({ kind: "idle" });

  async function onRetry() {
    setBusy(true);
    setOutcome({ kind: "idle" });
    try {
      const res = await retryPayment(orderNumber, token ?? "");
      if (!res.ok) {
        setOutcome({ kind: "error", message: res.error });
        toast.error(res.error);
        router.refresh();
        return;
      }
      const result = await payWithRazorpay(res.payment);
      if (result.status === "paid") {
        toast.success("Payment received — thank you!");
        router.refresh();
      } else if (result.status === "pending") {
        setOutcome({ kind: "pending" });
      } else if (result.status === "failed") {
        setOutcome({ kind: "error", message: result.message });
      }
      // "dismissed": the customer closed the window; leave the panel as it was.
    } catch (err) {
      setOutcome({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap gap-2">
        <Button size={size} onClick={onRetry} disabled={busy} aria-busy={busy}>
          {busy && <Loader2 className="animate-spin" aria-hidden />}
          {busy ? "Opening secure payment…" : label}
        </Button>
        {outcome.kind === "pending" && (
          <Button size={size} variant="outline" onClick={() => router.refresh()}>
            <RefreshCw aria-hidden /> Refresh status
          </Button>
        )}
      </div>
      <div aria-live="polite" className="text-sm">
        {outcome.kind === "pending" && (
          <p className="rounded-lg bg-accent-soft px-3 py-2 text-accent-hover">
            We&apos;re confirming your payment with the bank. This can take a minute — refresh to see the latest status.
            You won&apos;t be charged twice.
          </p>
        )}
        {outcome.kind === "error" && (
          <p role="alert" className="rounded-lg bg-sale-soft px-3 py-2 text-sale">
            {outcome.message}
          </p>
        )}
      </div>
    </div>
  );
}

/** Re-fetches the server-rendered order (e.g. while a payment confirmation is in flight). */
export function RefreshStatusButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Button variant="outline" className={className} disabled={pending} onClick={() => startTransition(() => router.refresh())}>
      <RefreshCw className={pending ? "animate-spin" : undefined} aria-hidden />
      {pending ? "Checking…" : "Refresh status"}
    </Button>
  );
}
