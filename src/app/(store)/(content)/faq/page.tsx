import { HelpCircle } from "lucide-react";
import { getFaqs } from "@/lib/cms";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { FaqList } from "@/components/marketing/faq-list";
import { HelpBlock } from "@/components/cms/help-block";
import { EmptyState } from "@/components/ui/misc";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "quality", label: "Refurbishment & quality" },
  { value: "orders", label: "Orders & payments" },
  { value: "shipping", label: "Shipping & delivery" },
  { value: "warranty", label: "Warranty" },
  { value: "returns", label: "Returns" },
] as const;

export function generateMetadata() {
  return pageMetadata({
    title: "Frequently Asked Questions",
    description:
      "Answers about refurbished laptop quality, condition grades, payments, delivery across India, warranty claims and returns at RenewByte.",
    path: "/faq",
  });
}

export default async function FaqPage() {
  const faqs = await getFaqs();
  const groups = CATEGORIES.map((c) => ({ ...c, items: faqs.filter((f) => f.category === c.value) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <>
      <PageHeader
        title="Frequently asked questions"
        description="Everything you might want to know before and after buying a refurbished laptop from us. Can't find your answer? Our team is a message away."
        crumbs={[{ name: "FAQ", path: "/faq" }]}
      />

      <div className="container-page py-10 sm:py-14">
        {groups.length === 0 ? (
          <EmptyState icon={<HelpCircle />} title="No questions yet" description="Please contact us and we'll help directly." />
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
            <nav aria-label="FAQ topics" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow mb-3">Topics</p>
              <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-0.5 lg:px-0">
                {groups.map((g) => (
                  <li key={g.value} className="shrink-0">
                    <a
                      href={`#${g.value}`}
                      className="flex items-center justify-between gap-3 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-muted transition-colors hover:text-foreground lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-3 lg:py-2 lg:hover:bg-subtle"
                    >
                      {g.label}
                      <span className="num hidden font-mono text-xs text-faint lg:inline">{g.items.length}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="min-w-0 space-y-12">
              {groups.map((g) => (
                <section key={g.value} id={g.value} aria-labelledby={`${g.value}-title`} className="scroll-mt-28">
                  <h2 id={`${g.value}-title`} className="mb-4 text-xl font-semibold tracking-tight">
                    {g.label}
                  </h2>
                  <FaqList items={g.items.map((f) => ({ question: f.question, answer: f.answer }))} />
                </section>
              ))}
              <HelpBlock title="Still have a question?" location="faq" />
            </div>
          </div>
        )}
      </div>
      <JsonLd data={faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.answer })))} />
    </>
  );
}
