import {
  BadgeCheck,
  BatteryCharging,
  ClipboardCheck,
  Cpu,
  Eraser,
  Gauge,
  Headset,
  Leaf,
  Lock,
  Package,
  RotateCcw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Maps CMS icon keys (see keystatic.config.ts) to Lucide icons. */
const ICONS: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  "badge-check": BadgeCheck,
  wrench: Wrench,
  lock: Lock,
  truck: Truck,
  "rotate-ccw": RotateCcw,
  "battery-charging": BatteryCharging,
  "scan-search": ScanSearch,
  cpu: Cpu,
  eraser: Eraser,
  sparkles: Sparkles,
  "clipboard-check": ClipboardCheck,
  package: Package,
  headset: Headset,
  leaf: Leaf,
  wallet: Wallet,
  gauge: Gauge,
};

export function CmsIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  const Icon = (name && ICONS[name]) || ShieldCheck;
  return <Icon className={className} aria-hidden strokeWidth={1.75} />;
}
