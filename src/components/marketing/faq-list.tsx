import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export type FaqItem = { question: string; answer: string };

/**
 * Accessible FAQ accordion. Pair with `faqJsonLd` from `@/lib/seo` when the
 * questions are the page's primary FAQ content.
 */
export function FaqList({
  items,
  className,
  defaultOpenFirst = false,
}: {
  items: readonly FaqItem[];
  className?: string;
  defaultOpenFirst?: boolean;
}) {
  if (!items.length) return null;
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpenFirst ? "faq-0" : undefined}
      className={cn("rounded-xl border border-border bg-surface px-5 sm:px-6", className)}
    >
      {items.map((item, i) => (
        <AccordionItem key={item.question} value={`faq-${i}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent className="whitespace-pre-line text-pretty">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
