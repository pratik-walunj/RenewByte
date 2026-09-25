import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getRefurbishProcess } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-shell";
import { CmsIcon } from "@/components/cms/icon";
import { TrustGrid } from "@/components/cms/trust-grid";
import { SectionHeading } from "@/components/ui/misc";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata() {
  const p = await getRefurbishProcess();
  return pageMetadata({
    title: p?.seo.title || "How We Refurbish Laptops",
    description:
      p?.seo.description ||
      "The documented process every RenewByte laptop goes through before it is listed — inspection, testing, data erasure, repair and grading.",
    path: "/how-we-refurbish",
  });
}

export default async function HowWeRefurbishPage() {
  const p = await getRefurbishProcess();
  const steps = p?.steps ?? [];
  const commitments = p?.commitments ?? [];
  const title = p?.title || "How we refurbish every laptop";

  return (
    <>
      <PageHeader
        eyebrow={steps.length ? `${steps.length}-step process` : "Our process"}
        title={title}
        description={p?.intro}
        crumbs={[{ name: "How we refurbish", path: "/how-we-refurbish" }]}
      />

      <section aria-label="Refurbishment steps" className="container-page py-12 sm:py-16">
        <ol className="relative mx-auto max-w-3xl">
          {steps.map((step, i) => {
            const last = i === steps.length - 1;
            return (
              <li key={step.title} className="relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 pb-10 last:pb-0 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-x-8">
                {!last && (
                  <span aria-hidden className="absolute top-14 bottom-2 left-7 w-px bg-border-strong sm:top-[4.25rem] sm:left-10" />
                )}
                <div className="flex flex-col items-center">
                  <span className="flex size-14 items-center justify-center rounded-full border border-border-strong bg-surface font-mono text-lg font-semibold tabular-nums sm:size-[4.25rem] sm:text-2xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="min-w-0 rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <CmsIcon name={step.icon} className="size-[18px]" />
                    </span>
                    <h2 className="text-lg font-semibold tracking-tight">
                      <span className="sr-only">Step {i + 1}: </span>
                      {step.title}
                    </h2>
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted text-pretty">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {commitments.length > 0 && (
        <section aria-labelledby="commitments-title" className="border-t border-border bg-surface">
          <div className="container-page py-14 sm:py-20">
            <SectionHeading
              id="commitments-title"
              eyebrow="Our promise"
              title="What every laptop comes with"
              subtitle="These apply to every unit we sell, regardless of cosmetic grade."
            />
            <TrustGrid items={commitments} />
          </div>
        </section>
      )}

      <section className="container-page py-14 sm:py-20">
        <div className="flex flex-col items-start gap-6 rounded-2xl bg-primary p-8 text-primary-foreground sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow mb-2 text-white/60">Ready when you are</p>
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Tested, graded and ready to ship.
            </h2>
            <p className="mt-2 text-[15px] text-white/70 text-pretty">
              Every listing shows its grade, measured battery health and warranty period — no guesswork.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/laptops" className={buttonVariants({ variant: "accent", size: "lg" })}>
              Shop laptops <ArrowRight aria-hidden />
            </Link>
            <Link
              href="/condition-grades"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-white/25 bg-transparent text-white hover:border-white/50 hover:bg-white/10")}
            >
              Condition grades explained
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
