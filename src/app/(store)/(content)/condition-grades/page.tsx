import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import type { ConditionGrade } from "@/generated/prisma/enums";
import { getConditionGrades } from "@/lib/cms";
import { GRADE_SHORT, GRADE_SLUG } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-shell";
import { GradeTag } from "@/components/product/grade";
import { EmptyState, SectionHeading } from "@/components/ui/misc";
import { buttonVariants } from "@/components/ui/button";
import { HelpBlock } from "@/components/cms/help-block";

export function generateMetadata() {
  return pageMetadata({
    title: "Refurbished Laptop Condition Grades Explained (A+, A, B, C)",
    description:
      "What Grade A+, A, B and C mean for a refurbished laptop: cosmetic condition, performance testing, battery health and warranty, compared side by side.",
    path: "/condition-grades",
  });
}

const ROWS = [
  { key: "summary", label: "In short" },
  { key: "cosmetic", label: "Cosmetic condition" },
  { key: "performance", label: "Performance" },
  { key: "battery", label: "Battery" },
  { key: "warranty", label: "Warranty" },
  { key: "idealFor", label: "Ideal for" },
] as const;

const ACCENT: Record<string, string> = {
  A_PLUS: "bg-emerald-500",
  A: "bg-blue-500",
  B: "bg-amber-500",
  C: "bg-slate-400",
};

function isGrade(value: string): value is ConditionGrade {
  return value in GRADE_SLUG;
}

export default async function ConditionGradesPage() {
  const { intro, grades: all } = await getConditionGrades();
  const grades = all.filter((g) => isGrade(g.grade));

  return (
    <>
      <PageHeader
        eyebrow="Buying guide"
        title="Condition grades explained"
        description={intro || "Every laptop is inspected and graded by hand before it is listed."}
        crumbs={[{ name: "Condition grades", path: "/condition-grades" }]}
      />

      <div className="container-page py-10 sm:py-14">
        {grades.length === 0 ? (
          <EmptyState icon={<ClipboardCheck />} title="Grade guide coming soon" />
        ) : (
          <>
            <section aria-labelledby="compare-title">
              <SectionHeading
                id="compare-title"
                title="Compare grades side by side"
                subtitle="Grades describe how a laptop looks. Every grade passes the same hardware and performance tests."
              />
              <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
                <table className="w-full min-w-[760px] border-collapse text-left text-[14px]">
                  <caption className="sr-only">Condition grade comparison</caption>
                  <thead>
                    <tr className="border-b border-border bg-subtle">
                      <th scope="col" className="w-40 px-4 py-3 font-medium text-muted">
                        <span className="sr-only">Aspect</span>
                      </th>
                      {grades.map((g) => (
                        <th key={g.grade} scope="col" className="px-4 py-3 align-bottom">
                          <span className="flex items-center gap-2">
                            <span aria-hidden className={cn("size-2 rounded-full", ACCENT[g.grade])} />
                            <span className="font-mono text-base font-semibold">{GRADE_SHORT[g.grade as ConditionGrade]}</span>
                            <span className="font-normal text-muted">{g.name}</span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row) => (
                      <tr key={row.key} className="border-b border-border last:border-b-0">
                        <th scope="row" className="px-4 py-3.5 align-top text-[13px] font-medium text-foreground">
                          {row.label}
                        </th>
                        {grades.map((g) => (
                          <td
                            key={g.grade}
                            className={cn(
                              "px-4 py-3.5 align-top leading-relaxed text-muted",
                              row.key === "summary" && "font-medium text-foreground",
                            )}
                          >
                            {g[row.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="grades-title" className="mt-16">
              <SectionHeading id="grades-title" title="Shop by grade" subtitle="Choose the balance of looks and price that suits you." />
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {grades.map((g) => {
                  const grade = g.grade as ConditionGrade;
                  return (
                    <li key={g.grade} id={GRADE_SLUG[grade]} className="flex scroll-mt-28 flex-col rounded-xl border border-border bg-surface p-5 shadow-card">
                      <GradeTag grade={grade} size="md" className="self-start" />
                      <h3 className="mt-4 text-lg font-semibold tracking-tight">{g.summary}</h3>
                      <dl className="mt-3 space-y-3 text-[14px]">
                        <div>
                          <dt className="eyebrow mb-1">Cosmetic</dt>
                          <dd className="leading-relaxed text-muted">{g.cosmetic}</dd>
                        </div>
                        <div>
                          <dt className="eyebrow mb-1">Ideal for</dt>
                          <dd className="leading-relaxed text-muted">{g.idealFor}</dd>
                        </div>
                      </dl>
                      <Link
                        href={`/laptops?condition=${GRADE_SLUG[grade]}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-5 self-start")}
                      >
                        Shop Grade {GRADE_SHORT[grade]} laptops <ArrowRight aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="mt-16 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-6">
                <h2 className="text-lg font-semibold tracking-tight">How grading works</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted text-pretty">
                  After testing and any repairs, a second technician inspects the laptop under consistent lighting and assigns
                  a grade against the standards above. Anything worth mentioning beyond the grade — a specific mark, a
                  replaced part — is noted on the product page.
                </p>
                <Link href="/how-we-refurbish" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
                  See our 9-step refurbishment process <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
              <HelpBlock title="Not sure which grade to pick?" description="Tell us how you'll use the laptop and we'll suggest the best-value option." location="condition_grades" />
            </section>
          </>
        )}
      </div>
    </>
  );
}
