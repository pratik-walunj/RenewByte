import { ClipboardCheck, Eraser, ScanSearch, Wallet } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/layout/page-shell";
import { TradeInForm } from "@/components/forms/trade-in-form";
import { FaqList } from "@/components/marketing/faq-list";
import { HelpBlock } from "@/components/cms/help-block";

export function generateMetadata() {
  return pageMetadata({
    title: "Sell Your Old Laptop — Get a Quote",
    description:
      "Sell or trade in your used laptop. Share a few details for a no-obligation quote, get it inspected, and receive payment once the price is confirmed.",
    path: "/sell",
  });
}

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Tell us about it",
    description: "Share the brand, model, configuration and honest condition. It takes about two minutes.",
  },
  {
    icon: Wallet,
    title: "Get an estimated quote",
    description: "Our team reviews the details and contacts you with an estimate — no obligation to accept.",
  },
  {
    icon: ScanSearch,
    title: "Pickup & inspection",
    description: "If you accept, we arrange pickup or drop-off where available and inspect the laptop to confirm the quote.",
  },
  {
    icon: Eraser,
    title: "Payment & data wipe",
    description: "Once the final price is agreed you're paid by bank transfer or UPI, and the storage is securely erased.",
  },
];

const FAQS = [
  {
    question: "How is the price decided?",
    answer:
      "The quote depends on the model, processor generation, RAM and storage, cosmetic condition, battery health and whether the charger is included. The estimate you receive is confirmed after we inspect the laptop in person.",
  },
  {
    question: "What if the final price is different from the estimate?",
    answer:
      "If the inspection finds something that wasn't mentioned — a fault, damage or missing parts — we'll explain what we found and offer a revised price. You're free to decline and have the laptop returned.",
  },
  {
    question: "Do you buy laptops that don't work?",
    answer:
      "Often, yes. Faulty laptops can still have value for parts or repair. Choose the 'Has a fault' condition and describe the problem so we can give a realistic estimate.",
  },
  {
    question: "What should I do with my data before selling?",
    answer:
      "Back up anything you need, sign out of your accounts (Microsoft, Apple ID, Google) and turn off device-locking features such as Find My on a Mac. We securely erase the storage of every laptop we buy, but signing out first ensures the device isn't locked to your account.",
  },
];

export default function SellPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sell / trade-in"
        title="Sell your old laptop"
        description="Give your laptop a second life. Tell us what you have and we'll get back to you with a no-obligation quote."
        crumbs={[{ name: "Sell your laptop", path: "/sell" }]}
      />

      <section aria-labelledby="sell-steps" className="container-page py-10 sm:py-14">
        <h2 id="sell-steps" className="sr-only">
          How selling works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <s.icon className="size-5" aria-hidden strokeWidth={1.75} />
                </span>
                <span className="font-mono text-2xl font-semibold text-border-strong tabular-nums" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-1 text-[14px] leading-relaxed text-muted text-pretty">{s.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="container-page pb-14 sm:pb-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-14">
          <section aria-labelledby="sell-form-title" className="min-w-0">
            <h2 id="sell-form-title" className="text-xl font-semibold tracking-tight">
              Request a quote
            </h2>
            <p className="mt-1.5 mb-6 text-[15px] text-muted">The more accurate the details, the more accurate the quote.</p>
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-7">
              <TradeInForm />
            </div>
          </section>
          <aside className="space-y-6">
            <div>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">Common questions</h2>
              <FaqList items={FAQS} />
            </div>
            <HelpBlock title="Selling several laptops?" description="Businesses and institutions refreshing their fleet can contact us directly." location="sell" />
          </aside>
        </div>
      </div>
    </>
  );
}
