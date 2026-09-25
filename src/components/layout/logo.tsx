import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Wordmark with a simple "renewed" loop mark. Uses the CMS logo image when one is set. */
export function Logo({
  name = "RenewByte",
  src,
  className,
  inverted,
}: {
  name?: string;
  src?: string | null;
  className?: string;
  inverted?: boolean;
}) {
  return (
    <Link href="/" aria-label={`${name} — home`} className={cn("inline-flex shrink-0 items-center gap-2", className)}>
      {src ? (
        <Image src={src} alt={name} width={140} height={32} className="h-7 w-auto" priority />
      ) : (
        <>
          <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
            <rect width="32" height="32" rx="8" fill={inverted ? "#fff" : "#111827"} />
            <path
              d="M10 20.5V11.5h6.2a3.6 3.6 0 0 1 0 7.2H13l5.4 5.3"
              fill="none"
              stroke={inverted ? "#111827" : "#fff"}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="23" cy="10" r="2.2" fill="#2563eb" />
          </svg>
          <span className={cn("text-[17px] font-semibold tracking-tight", inverted ? "text-white" : "text-foreground")}>
            {name}
          </span>
        </>
      )}
    </Link>
  );
}
