import { AlertTriangle, CheckCircle2, CircleSlash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_STATUS_LABEL } from "@/lib/constants";
import type { InboxStatus, OrderStatus, PaymentStatus, ProductStatus, ReviewStatus } from "@/generated/prisma/enums";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

const PAYMENT_TONE: Record<PaymentStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
  CREATED: "warning",
  AUTHORIZED: "info",
  CAPTURED: "success",
  FAILED: "danger",
  REFUNDED: "neutral",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={PAYMENT_TONE[status]}>{PAYMENT_STATUS_LABEL[status]}</Badge>;
}

export type StockLevel = "in" | "low" | "out";

export function stockLevel(available: number, threshold: number): StockLevel {
  if (available <= 0) return "out";
  if (available <= threshold) return "low";
  return "in";
}

/** Stock state always carries an icon + label, never colour alone. */
export function StockBadge({ level }: { level: StockLevel }) {
  if (level === "out")
    return (
      <Badge tone="danger">
        <CircleSlash aria-hidden /> Out of stock
      </Badge>
    );
  if (level === "low")
    return (
      <Badge tone="warning">
        <AlertTriangle aria-hidden /> Low stock
      </Badge>
    );
  return (
    <Badge tone="success">
      <CheckCircle2 aria-hidden /> In stock
    </Badge>
  );
}

const PRODUCT_STATUS: Record<ProductStatus, { label: string; tone: "success" | "neutral" | "outline" }> = {
  PUBLISHED: { label: "Published", tone: "success" },
  DRAFT: { label: "Draft", tone: "neutral" },
  ARCHIVED: { label: "Archived", tone: "outline" },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const s = PRODUCT_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export const INBOX_STATUS_LABEL: Record<InboxStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

export function InboxStatusBadge({ status }: { status: InboxStatus }) {
  const tone = status === "NEW" ? "info" : status === "IN_PROGRESS" ? "warning" : "success";
  return <Badge tone={tone}>{INBOX_STATUS_LABEL[status]}</Badge>;
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const tone = status === "APPROVED" ? "success" : status === "REJECTED" ? "danger" : "warning";
  const label = status === "APPROVED" ? "Approved" : status === "REJECTED" ? "Rejected" : "Pending";
  return <Badge tone={tone}>{label}</Badge>;
}
