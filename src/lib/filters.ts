/**
 * Shareable, URL-driven catalogue filters. Client- and server-safe.
 *
 *   /laptops?brand=dell,hp&ram=16gb&storage=512gb&min=20000&max=40000&sort=price-asc
 */
import { CONDITION_GRADES, GRADE_SLUG } from "@/lib/constants";
import type { ConditionGrade } from "@/generated/prisma/enums";

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "best-selling", label: "Best Selling" },
  { value: "discount", label: "Highest Discount" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const SCREEN_BUCKETS = [
  { slug: "13-and-below", label: '13.3" & below', min: 0, max: 13.5 },
  { slug: "14", label: '14"', min: 13.5, max: 14.5 },
  { slug: "15", label: '15" – 15.6"', min: 14.5, max: 15.9 },
  { slug: "16-and-above", label: '16" & above', min: 15.9, max: 99 },
] as const;

export const OS_FAMILIES = [
  { slug: "windows-11", label: "Windows 11", match: "Windows 11" },
  { slug: "windows-10", label: "Windows 10", match: "Windows 10" },
  { slug: "macos", label: "macOS", match: "macOS" },
  { slug: "chromeos", label: "ChromeOS", match: "ChromeOS" },
  { slug: "linux", label: "Linux", match: "Linux" },
] as const;

export const WARRANTY_OPTIONS = [
  { value: 6, label: "6 months +" },
  { value: 12, label: "12 months +" },
] as const;

export type CatalogFilters = {
  q?: string;
  brand: string[];
  category: string[];
  min?: number;
  max?: number;
  processor: string[];
  gen: string[];
  ram: number[];
  storage: number[];
  ssd: boolean;
  screen: string[];
  gpu?: "integrated" | "dedicated";
  os: string[];
  condition: ConditionGrade[];
  warranty?: number;
  inStock: boolean;
  deal: boolean;
  sort: SortValue;
  page: number;
};

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function read(params: ParamSource, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

function list(params: ParamSource, key: string) {
  const raw = read(params, key);
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => /^[a-z0-9.+-]{1,48}$/.test(s)),
    ),
  ).slice(0, 20);
}

function int(value: string | undefined) {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** "16gb" → 16, "1tb" → 1024 */
export function parseSizeToken(token: string) {
  const m = token.match(/^(\d+(?:\.\d+)?)(gb|tb)$/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return m[2] === "tb" ? Math.round(n * 1024) : Math.round(n);
}

export function sizeToken(gb: number) {
  return gb >= 1024 && gb % 1024 === 0 ? `${gb / 1024}tb` : `${gb}gb`;
}

const gradeFromSlug = Object.fromEntries(
  CONDITION_GRADES.map((g) => [GRADE_SLUG[g], g]),
) as Record<string, ConditionGrade>;

export function parseFilters(params: ParamSource): CatalogFilters {
  const sortRaw = read(params, "sort");
  const sort = (SORT_OPTIONS.find((o) => o.value === sortRaw)?.value ?? "featured") as SortValue;
  const gpu = read(params, "gpu");
  const q = read(params, "q")?.trim().slice(0, 80);
  return {
    q: q || undefined,
    brand: list(params, "brand"),
    category: list(params, "category"),
    min: int(read(params, "min")),
    max: int(read(params, "max")),
    processor: list(params, "processor"),
    gen: list(params, "gen"),
    ram: list(params, "ram").map(parseSizeToken).filter((n): n is number => !!n),
    storage: list(params, "storage").map(parseSizeToken).filter((n): n is number => !!n),
    ssd: read(params, "ssd") === "1",
    screen: list(params, "screen").filter((s) => SCREEN_BUCKETS.some((b) => b.slug === s)),
    gpu: gpu === "integrated" || gpu === "dedicated" ? gpu : undefined,
    os: list(params, "os").filter((s) => OS_FAMILIES.some((o) => o.slug === s)),
    condition: list(params, "condition")
      .map((s) => gradeFromSlug[s])
      .filter((g): g is ConditionGrade => !!g),
    warranty: int(read(params, "warranty")),
    inStock: read(params, "availability") === "in-stock",
    deal: read(params, "deal") === "1",
    sort,
    page: Math.max(1, int(read(params, "page")) ?? 1),
  };
}

/** Serialise filters back to a query string (stable key order, defaults omitted). */
export function filtersToSearchParams(f: Partial<CatalogFilters>) {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.brand?.length) sp.set("brand", f.brand.join(","));
  if (f.category?.length) sp.set("category", f.category.join(","));
  if (f.min !== undefined) sp.set("min", String(f.min));
  if (f.max !== undefined) sp.set("max", String(f.max));
  if (f.processor?.length) sp.set("processor", f.processor.join(","));
  if (f.gen?.length) sp.set("gen", f.gen.join(","));
  if (f.ram?.length) sp.set("ram", f.ram.map(sizeToken).join(","));
  if (f.storage?.length) sp.set("storage", f.storage.map(sizeToken).join(","));
  if (f.ssd) sp.set("ssd", "1");
  if (f.screen?.length) sp.set("screen", f.screen.join(","));
  if (f.gpu) sp.set("gpu", f.gpu);
  if (f.os?.length) sp.set("os", f.os.join(","));
  if (f.condition?.length) sp.set("condition", f.condition.map((g) => GRADE_SLUG[g]).join(","));
  if (f.warranty) sp.set("warranty", String(f.warranty));
  if (f.inStock) sp.set("availability", "in-stock");
  if (f.deal) sp.set("deal", "1");
  if (f.sort && f.sort !== "featured") sp.set("sort", f.sort);
  if (f.page && f.page > 1) sp.set("page", String(f.page));
  return sp;
}

export function countActiveFilters(f: CatalogFilters) {
  return (
    f.brand.length +
    f.category.length +
    (f.min !== undefined || f.max !== undefined ? 1 : 0) +
    f.processor.length +
    f.gen.length +
    f.ram.length +
    f.storage.length +
    (f.ssd ? 1 : 0) +
    f.screen.length +
    (f.gpu ? 1 : 0) +
    f.os.length +
    f.condition.length +
    (f.warranty ? 1 : 0) +
    (f.inStock ? 1 : 0) +
    (f.deal ? 1 : 0)
  );
}

export function tokenSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
