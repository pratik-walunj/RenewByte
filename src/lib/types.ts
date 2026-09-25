import type { ConditionGrade, GpuType, StorageType } from "@/generated/prisma/enums";

export type StockState = "in" | "low" | "out";

export type ImageRef = { url: string; alt: string };

/** Serializable product summary used by cards, quick view, compare and wishlist. */
export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  brand: { name: string; slug: string };
  category: { name: string; slug: string };
  processor: string;
  processorFamily: string;
  processorGeneration: string | null;
  ramGb: number;
  storageGb: number;
  storageType: StorageType;
  displaySize: number;
  resolution: string | null;
  graphics: string;
  operatingSystem: string;
  batteryHealth: number | null;
  weightKg: number | null;
  conditionGrade: ConditionGrade;
  mrp: number;
  price: number;
  discountPercent: number;
  warrantyMonths: number;
  ratingAvg: number;
  ratingCount: number;
  isDeal: boolean;
  isBestSeller: boolean;
  isDemo: boolean;
  dealEndsAt: string | null;
  image: ImageRef | null;
  hoverImage: ImageRef | null;
  stock: StockState;
  available: number;
};

export type ProductDetailData = ProductCardData & {
  shortDescription: string | null;
  description: string | null;
  processorBrand: string;
  ramType: string | null;
  displayType: string | null;
  gpuType: GpuType;
  batteryBackup: string | null;
  color: string | null;
  keyboard: string | null;
  ports: string[];
  features: string[];
  highlights: string[];
  whatsIncluded: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
  images: { url: string; alt: string; width: number; height: number }[];
  specifications: { group: string; label: string; value: string }[];
};

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: ImageRef | null;
  specs: string;
  conditionGrade: ConditionGrade;
  warrantyMonths: number;
  price: number;
  mrp: number;
  quantity: number;
  available: number;
  savedForLater: boolean;
  lineTotal: number;
};

export type CartTotals = {
  subtotal: number;
  mrpTotal: number;
  discount: number;
  shipping: number;
  codFee: number;
  tax: number;
  total: number;
  taxIncluded: boolean;
};

export type CartView = {
  items: CartLine[];
  saved: CartLine[];
  count: number;
  coupon: { code: string; discount: number; description: string | null } | null;
  couponError: string | null;
  totals: CartTotals;
  freeShippingRemaining: number | null;
};

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
