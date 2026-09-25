import { Check } from "lucide-react";
import { faqJsonLd } from "@/lib/seo";
import { MarkdocContent } from "@/components/cms/markdoc";
import { FaqList } from "@/components/marketing/faq-list";
import { JsonLd } from "@/components/seo/json-ld";

type Landing = {
  highlights: readonly string[];
  faqs: readonly { question: string; answer: string }[];
  content: { node: unknown } | null | undefined;
};

export function LandingHighlights({ items }: { items: readonly string[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
      {items.map((h) => (
        <li key={h} className="flex items-center gap-1.5 text-[13.5px] text-foreground/80">
          <Check className="size-4 text-success" aria-hidden />
          {h}
        </li>
      ))}
    </ul>
  );
}

/** Unique buying-guide copy + FAQs below the product grid, so landing pages are never thin. */
export function LandingFooterContent({ landing, title }: { landing: Landing | null; title: string }) {
  if (!landing) return null;
  const faqs = landing.faqs.filter((f) => f.question && f.answer);
  const hasContent = !!landing.content?.node;
  if (!hasContent && !faqs.length) return null;
  return (
    <section className="border-t border-border bg-surface" aria-label={`${title} buying guide`}>
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.4fr_1fr]">
        {hasContent && (
          <div className="min-w-0">
            <MarkdocContent node={landing.content!.node} />
          </div>
        )}
        {faqs.length > 0 && (
          <div>
            <h2 className="mb-2 text-xl font-semibold tracking-tight">Frequently asked questions</h2>
            <FaqList items={faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
            <JsonLd data={faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.answer })))} />
          </div>
        )}
      </div>
    </section>
  );
}
