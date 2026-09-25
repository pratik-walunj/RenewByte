import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const QUICK_LINKS = [
  { label: "Under ₹20,000", href: "/laptops/under-20000" },
  { label: "Under ₹30,000", href: "/laptops/under-30000" },
  { label: "Business laptops", href: "/category/business-laptops" },
  { label: "MacBooks", href: "/category/macbooks" },
];

/** Compact "shop laptops" call to action used alongside editorial content. */
export function ShopCta({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <aside
      aria-label="Shop refurbished laptops"
      className={cn("rounded-xl bg-primary p-6 text-primary-foreground", !compact && "sm:p-8", className)}
    >
      <ShieldCheck className="size-6 text-white/70" aria-hidden strokeWidth={1.75} />
      <p className={cn("mt-3 font-semibold tracking-tight text-balance", compact ? "text-lg" : "text-xl sm:text-2xl")}>
        Tested, graded and backed by warranty
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-white/70 text-pretty">
        Every laptop lists its condition grade, measured battery health and warranty period.
      </p>
      <Link href="/laptops" className={cn(buttonVariants({ variant: "accent" }), "mt-5 w-full sm:w-auto", compact && "sm:w-full")}>
        Shop refurbished laptops <ArrowRight aria-hidden />
      </Link>
      <ul className="mt-5 flex flex-wrap gap-2">
        {QUICK_LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-flex h-8 items-center rounded-full border border-white/20 px-3 text-[13px] text-white/80 transition-colors hover:border-white/50 hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
