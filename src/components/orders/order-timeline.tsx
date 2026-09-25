import { Check, X } from "lucide-react";
import type { OrderStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { formatOrderDateTime, isClosedStatus, type TimelineStep } from "@/components/orders/order-view";

type Props = {
  steps: TimelineStep[];
  status: OrderStatus;
  /** When the order was cancelled/refunded (shown as the final row). */
  closedAt?: string | null;
  className?: string;
};

/**
 * Vertical 7-step delivery timeline. Works in both server and client trees
 * (no hooks). Cancelled/refunded orders keep the steps they reached and end
 * with a closing row.
 */
export function OrderTimeline({ steps, status, closedAt, className }: Props) {
  const closed = isClosedStatus(status);
  const rows = steps.map((s) => ({
    ...s,
    state: closed ? (s.at ? "done" : "skipped") : s.current ? "current" : s.done ? "done" : "upcoming",
  }));
  // When closed, hide the steps that were never reached to keep the story short.
  const visible = closed ? rows.filter((r) => r.state === "done") : rows;

  return (
    <ol className={cn("relative", className)} aria-label="Order progress">
      {visible.map((step, i) => {
        const last = i === visible.length - 1 && !closed;
        return (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0" aria-current={step.state === "current" ? "step" : undefined}>
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-7 bottom-1 left-[13px] w-px",
                  step.state === "done" && !closed ? "bg-foreground" : "bg-border-strong",
                )}
              />
            )}
            <StepMarker state={step.state} />
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-[15px] leading-6 font-medium",
                  step.state === "upcoming" && "text-muted",
                  step.state === "current" && "text-foreground",
                )}
              >
                {step.label}
                <span className="sr-only">
                  {step.state === "done" ? " — completed" : step.state === "current" ? " — current step" : " — upcoming"}
                </span>
              </p>
              {step.at ? (
                <p className="num text-[13px] text-muted">
                  <time dateTime={step.at}>{formatOrderDateTime(step.at)}</time>
                </p>
              ) : step.state === "current" ? (
                <p className="text-[13px] text-muted">In progress</p>
              ) : null}
            </div>
          </li>
        );
      })}
      {closed && (
        <li className="relative flex gap-4">
          <span className="relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-full bg-sale text-white">
            <X className="size-3.5" strokeWidth={3} aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-[15px] leading-6 font-medium text-sale">
              {status === "REFUNDED" ? "Refunded" : "Cancelled"}
            </p>
            {closedAt && (
              <p className="num text-[13px] text-muted">
                <time dateTime={closedAt}>{formatOrderDateTime(closedAt)}</time>
              </p>
            )}
          </div>
        </li>
      )}
    </ol>
  );
}

function StepMarker({ state }: { state: string }) {
  if (state === "done") {
    return (
      <span className="relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-surface">
        <span className="absolute size-2.5 rounded-full bg-accent/40 motion-safe:animate-ping" aria-hidden />
        <span className="size-2.5 rounded-full bg-accent" aria-hidden />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface"
    >
      <span className="size-1.5 rounded-full bg-border-strong" />
    </span>
  );
}
