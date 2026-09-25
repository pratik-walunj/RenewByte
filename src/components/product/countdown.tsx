"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Deal countdown. Renders nothing until mounted to avoid hydration mismatch. */
export function Countdown({ endsAt, className, compact }: { endsAt: string; className?: string; compact?: boolean }) {
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  if (now === null) return <span className={cn("inline-block h-5", className)} aria-hidden />;
  const left = new Date(endsAt).getTime() - now;
  if (left <= 0) return <span className={className}>Deal ended</span>;
  const { d, h, m, s } = parts(left);
  const pad = (n: number) => String(n).padStart(2, "0");

  if (compact) {
    return (
      <span className={cn("num font-mono", className)}>
        Ends in {d > 0 ? `${d}d ` : ""}
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    );
  }
  const cells = [
    ...(d > 0 ? [["Days", d] as const] : []),
    ["Hrs", h] as const,
    ["Min", m] as const,
    ["Sec", s] as const,
  ];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} role="timer" aria-label={`Ends in ${d} days ${h} hours ${m} minutes`}>
      {cells.map(([label, v]) => (
        <span key={label} className="flex min-w-11 flex-col items-center rounded-lg bg-white/10 px-2 py-1.5">
          <span className="num font-mono text-lg leading-none font-semibold">{pad(v)}</span>
          <span className="mt-1 text-[10px] tracking-wide uppercase opacity-70">{label}</span>
        </span>
      ))}
    </span>
  );
}
