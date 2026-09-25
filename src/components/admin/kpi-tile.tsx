import Link from "next/link";
import { cn } from "@/lib/utils";

/** Stat tile: sentence-case label, a single value, optional hint and link. */
export function KpiTile({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: "default" | "warning" | "danger";
}) {
  const body = (
    <>
      <p className="text-[13px] text-muted">{label}</p>
      <p
        className={cn(
          "mt-1.5 truncate text-2xl font-semibold tracking-tight sm:text-[26px]",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-sale",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-muted">{hint}</p>}
    </>
  );
  const cls = "block min-w-0 rounded-xl border border-border bg-surface p-4";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-border-strong")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
