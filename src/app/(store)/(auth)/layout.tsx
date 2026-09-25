import { BadgeCheck, LockKeyhole, ShieldCheck } from "lucide-react";

const TRUST = [
  {
    icon: ShieldCheck,
    title: "Warranty on every laptop",
    body: "Each device ships with a written warranty, and claims are handled from your account.",
  },
  {
    icon: BadgeCheck,
    title: "Tested and graded",
    body: "Every unit is inspected and given a transparent condition grade before it's listed.",
  },
  {
    icon: LockKeyhole,
    title: "Secure payments",
    body: "Online payments are processed by Razorpay. We never see or store your card details.",
  },
];

/** Shared shell for sign-in, sign-up and password recovery: centred card + trust sidebar on desktop. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-8 sm:py-14">
      <div className="mx-auto grid max-w-4xl items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8 lg:max-w-none">
          {children}
        </div>
        <aside aria-label="Why shop with RenewByte" className="hidden rounded-2xl bg-stage p-7 lg:block">
          <p className="eyebrow mb-5">Why RenewByte</p>
          <ul className="space-y-6">
            {TRUST.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface">
                  <Icon className="size-4.5 text-foreground" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
