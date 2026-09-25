/**
 * Client-safe domain constants. These mirror the Prisma enums so that client
 * components never need to import generated Prisma code.
 */
import type {
  ConditionGrade,
  OrderStatus,
  PaymentStatus,
  StorageType,
} from "@/generated/prisma/enums";

export const SITE_NAME = "RenewByte";

export const CONDITION_GRADES = ["A_PLUS", "A", "B", "C"] as const satisfies readonly ConditionGrade[];

export const GRADE_LABEL: Record<ConditionGrade, string> = {
  A_PLUS: "Grade A+",
  A: "Grade A",
  B: "Grade B",
  C: "Grade C",
};

export const GRADE_SHORT: Record<ConditionGrade, string> = {
  A_PLUS: "A+",
  A: "A",
  B: "B",
  C: "C",
};

/** URL-safe grade slugs used in filters (?condition=a-plus,a) */
export const GRADE_SLUG: Record<ConditionGrade, string> = {
  A_PLUS: "a-plus",
  A: "a",
  B: "b",
  C: "c",
};

export const STORAGE_TYPE_LABEL: Record<StorageType, string> = {
  NVME_SSD: "NVMe SSD",
  SSD: "SSD",
  HDD: "HDD",
  EMMC: "eMMC",
};

export const ORDER_STATUSES = [
  "PENDING",
  "PAYMENT_PROCESSING",
  "PAID",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const satisfies readonly OrderStatus[];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAYMENT_PROCESSING: "Payment processing",
  PAID: "Paid",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  PENDING: "warning",
  PAYMENT_PROCESSING: "warning",
  PAID: "info",
  PROCESSING: "info",
  PACKED: "info",
  SHIPPED: "info",
  OUT_FOR_DELIVERY: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "neutral",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  CREATED: "Awaiting payment",
  AUTHORIZED: "Authorised",
  CAPTURED: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

/** Customer-facing tracking timeline, in order. */
export const TRACKING_STEPS = [
  { key: "PLACED", label: "Order placed" },
  { key: "CONFIRMED", label: "Payment confirmed" },
  { key: "PROCESSING", label: "Processing" },
  { key: "PACKED", label: "Packed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { key: "DELIVERED", label: "Delivered" },
] as const;

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const COMPARE_LIMIT = 4;
export const PRODUCTS_PER_PAGE = 24;
