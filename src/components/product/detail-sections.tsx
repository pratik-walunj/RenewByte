import Link from "next/link";
import { BatteryMedium, Check, Package, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import type { ProductDetailData } from "@/lib/types";
import { GRADE_LABEL, STORAGE_TYPE_LABEL } from "@/lib/constants";
import { formatStorage } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SectionBlock({ id, title, children, className }: { id: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={cn("scroll-mt-32 border-t border-border py-10", className)}>
      <h2 id={`${id}-h`} className="mb-6 text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Structured spec table. Core fields come from columns; extra rows from ProductSpecification. */
export function SpecTable({ p }: { p: ProductDetailData }) {
  const core: [string, string | null | undefined][] = [
    ["Processor", p.processor],
    ["Generation", p.processorGeneration],
    ["RAM", `${p.ramGb}GB${p.ramType ? ` ${p.ramType}` : ""}`],
    ["Storage", `${formatStorage(p.storageGb)} ${STORAGE_TYPE_LABEL[p.storageType]}`],
    ["Display", [`${p.displaySize} inch`, p.resolution, p.displayType].filter(Boolean).join(", ")],
    ["Graphics", p.graphics],
    ["Operating system", p.operatingSystem],
    ["Keyboard", p.keyboard],
    ["Battery health", p.batteryHealth !== null ? `${p.batteryHealth}% of original capacity` : null],
    ["Battery backup", p.batteryBackup],
    ["Weight", p.weightKg ? `${p.weightKg} kg` : null],
    ["Colour", p.color],
    ["Ports", p.ports.length ? p.ports.join(", ") : null],
    ["Condition", GRADE_LABEL[p.conditionGrade]],
    ["Warranty", `${p.warrantyMonths} months`],
    ["SKU", p.sku],
  ];
  const coreLabels = new Set(core.map(([k]) => k.toLowerCase()));
  const extra = p.specifications.filter((s) => !coreLabels.has(s.label.toLowerCase()) && !["screen size", "resolution", "panel", "colour"].includes(s.label.toLowerCase()));
  const rows = [...core.filter(([, v]) => v), ...extra.map((s) => [s.label, s.value] as [string, string])];

  return (
    <dl className="grid overflow-hidden rounded-xl border border-border bg-surface sm:grid-cols-2">
      {rows.map(([label, value], i) => (
        <div
          key={label + i}
          className={cn(
            "grid grid-cols-[130px_1fr] gap-4 border-border px-4 py-3 text-sm sm:grid-cols-[150px_1fr]",
            "border-b sm:[&:nth-last-child(-n+2)]:border-b-0 [&:last-child]:border-b-0",
            "sm:odd:border-r",
          )}
        >
          <dt className="text-muted">{label}</dt>
          <dd className="font-medium break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function BatteryInfo({ health, backup }: { health: number | null; backup: string | null }) {
  if (health === null && !backup) return <p className="text-sm text-muted">Battery details are listed in the specifications.</p>;
  const tone = health === null ? "bg-faint" : health >= 85 ? "bg-success-bright" : health >= 75 ? "bg-warning-bright" : "bg-sale";
  return (
    <div className="grid gap-6 rounded-xl border border-border bg-surface p-5 sm:grid-cols-[1fr_1.3fr] sm:p-6">
      {health !== null && (
        <div>
          <p className="eyebrow">Measured battery health</p>
          <p className="num mt-2 flex items-baseline gap-1 text-4xl font-semibold tracking-tight">
            {health}
            <span className="text-lg text-muted">%</span>
          </p>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-subtle"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={health}
            aria-label="Battery health"
          >
            <div className={cn("h-full rounded-full", tone)} style={{ width: `${health}%` }} />
          </div>
          <p className="mt-2 text-[13px] text-muted">Of the battery&apos;s original design capacity, measured during testing.</p>
        </div>
      )}
      <div className="space-y-3 text-sm">
        {backup && (
          <p className="flex items-start gap-2.5">
            <BatteryMedium className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <span>
              <span className="font-medium">Typical backup: {backup}</span>
              <span className="block text-muted">For light use (browsing, documents) at moderate brightness. Heavier workloads use more power.</span>
            </span>
          </p>
        )}
        <p className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <span className="text-muted">
            Batteries are consumable parts. See the <Link href="/warranty" className="font-medium text-accent hover:underline">warranty policy</Link> for battery coverage.
          </span>
        </p>
      </div>
    </div>
  );
}

export function IncludedList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {items.map((i) => (
        <li key={i} className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
          <Package className="size-4 text-muted" aria-hidden />
          {i}
        </li>
      ))}
    </ul>
  );
}

export function PolicyCards({ warrantyMonths, shippingText }: { warrantyMonths: number; shippingText: string }) {
  const cards = [
    {
      id: "warranty",
      icon: ShieldCheck,
      title: `${warrantyMonths}-month warranty`,
      body: "Covers hardware faults under normal use. Claims are handled by repair or replacement.",
      href: "/warranty",
      cta: "Warranty details",
    },
    {
      id: "shipping",
      icon: Truck,
      title: "Shipping",
      body: shippingText,
      href: "/shipping",
      cta: "Shipping policy",
    },
    {
      id: "returns",
      icon: RotateCcw,
      title: "Easy returns",
      body: "Not right for you? Eligible returns are accepted within the return window in its original condition.",
      href: "/returns",
      cta: "Return policy",
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((c) => (
        <div key={c.id} id={c.id} className="scroll-mt-32 rounded-xl border border-border bg-surface p-5">
          <c.icon className="size-5 text-accent" aria-hidden />
          <h3 className="mt-3 font-semibold">{c.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.body}</p>
          <Link href={c.href} className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
            {c.cta} →
          </Link>
        </div>
      ))}
    </div>
  );
}

export function Highlights({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-2.5">
      {items.map((h) => (
        <li key={h} className="flex items-start gap-2.5 text-[15px]">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
            <Check className="size-3" strokeWidth={3} aria-hidden />
          </span>
          {h}
        </li>
      ))}
    </ul>
  );
}
