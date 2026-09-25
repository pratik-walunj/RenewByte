/** Search-param helpers shared by admin list pages. */
export const ADMIN_PAGE_SIZE = 20;

export type SearchParams = Record<string, string | string[] | undefined>;

export function param(sp: SearchParams, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 120) ?? "";
}

export function pageParam(sp: SearchParams) {
  const n = Number.parseInt(param(sp, "page"), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10_000) : 1;
}

/** Pick a value from an allow-list, or return the fallback. */
export function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T | "" = ""): T | "" {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function pageInfo(total: number, page: number, size = ADMIN_PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(total / size));
  return { total, page: Math.min(page, pages), pages, size };
}

export type PageInfo = ReturnType<typeof pageInfo>;
