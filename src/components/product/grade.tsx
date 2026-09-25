"use client";

import * as React from "react";
import { Info } from "lucide-react";
import type { ConditionGrade } from "@/generated/prisma/enums";
import { GRADE_SHORT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export type GradeContent = {
  intro: string;
  grades: readonly {
    grade: string;
    name: string;
    summary: string;
    cosmetic: string;
    performance: string;
    battery: string;
    warranty: string;
    idealFor: string;
  }[];
};

const GradeContext = React.createContext<GradeContent>({ intro: "", grades: [] });

export function GradeProvider({ value, children }: { value: GradeContent; children: React.ReactNode }) {
  return <GradeContext.Provider value={value}>{children}</GradeContext.Provider>;
}

export function useGrades() {
  return React.useContext(GradeContext);
}

const DOT: Record<ConditionGrade, string> = {
  A_PLUS: "bg-emerald-500",
  A: "bg-blue-500",
  B: "bg-amber-500",
  C: "bg-slate-400",
};

/** Inspection-tag style grade label. */
export function GradeTag({ grade, className, size = "sm" }: { grade: ConditionGrade; className?: string; size?: "sm" | "md" }) {
  const { grades } = useGrades();
  const name = grades.find((g) => g.grade === grade)?.name;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface font-mono font-medium tracking-wide text-foreground uppercase",
        size === "sm" ? "h-6 px-1.5 text-[10.5px]" : "h-7 px-2 text-[11.5px]",
        className,
      )}
      title={name ? `Grade ${GRADE_SHORT[grade]} — ${name}` : undefined}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", DOT[grade])} />
      Grade {GRADE_SHORT[grade]}
      {size === "md" && name && <span className="font-sans font-normal tracking-normal text-muted normal-case">· {name}</span>}
    </span>
  );
}

export function GradeInfoDialog({ grade, trigger }: { grade?: ConditionGrade; trigger?: React.ReactNode }) {
  const { intro, grades } = useGrades();
  const [active, setActive] = React.useState<string>(grade ?? grades[0]?.grade ?? "A");
  const current = grades.find((g) => g.grade === active) ?? grades[0];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-accent underline-offset-4 hover:underline"
          >
            <Info className="size-3.5" aria-hidden />
            What does this grade mean?
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0">
        <div className="border-b border-border px-6 pt-6 pb-4">
          <DialogTitle>Condition grades explained</DialogTitle>
          <DialogDescription className="mt-1.5 pr-8 text-pretty">{intro}</DialogDescription>
        </div>
        {grades.length > 0 && current ? (
          <div className="px-6 pt-4 pb-6">
            <div role="tablist" aria-label="Grades" className="mb-5 grid grid-cols-4 gap-2">
              {grades.map((g) => (
                <button
                  key={g.grade}
                  role="tab"
                  type="button"
                  aria-selected={g.grade === active}
                  onClick={() => setActive(g.grade)}
                  className={cn(
                    "rounded-lg border px-2 py-2.5 text-center transition-colors",
                    g.grade === active
                      ? "border-foreground bg-primary text-white"
                      : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <span className="block font-mono text-sm font-semibold">
                    {GRADE_SHORT[g.grade as ConditionGrade] ?? g.grade}
                  </span>
                  <span className={cn("block text-[11px]", g.grade === active ? "text-white/75" : "text-muted")}>
                    {g.name}
                  </span>
                </button>
              ))}
            </div>
            <p className="mb-4 text-[15px] font-medium">{current.summary}</p>
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ["Visual condition", current.cosmetic],
                ["Performance", current.performance],
                ["Battery", current.battery],
                ["Warranty", current.warranty],
              ].map(([label, text]) => (
                <div key={label} className="rounded-lg bg-subtle p-3.5">
                  <dt className="eyebrow mb-1">{label}</dt>
                  <dd className="text-sm leading-relaxed text-foreground/85">{text}</dd>
                </div>
              ))}
            </dl>
            {current.idealFor && (
              <p className="mt-4 text-sm text-muted">
                <span className="font-medium text-foreground">Ideal for:</span> {current.idealFor}
              </p>
            )}
          </div>
        ) : (
          <p className="px-6 py-6 text-sm text-muted">Grade information hasn&apos;t been published yet.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
