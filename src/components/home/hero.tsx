import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroContent = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  image: string | null;
  imageAlt: string;
  checklistTitle: string;
  checklist: readonly string[];
};

export function Hero({ hero, stats }: { hero: HeroContent; stats: { products: number; fromPrice: string | null } }) {
  const lines = hero.headline.split("\n").filter(Boolean);
  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_85%_30%,#eff6ff_0%,transparent_70%)]"
      />
      <div className="container-page relative grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-20">
        <div className="animate-fade-in">
          {hero.eyebrow && (
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[12.5px] font-medium text-foreground/80 shadow-card">
              <span className="size-1.5 rounded-full bg-success-bright" aria-hidden />
              {hero.eyebrow}
            </p>
          )}
          <h1 className="text-[34px] leading-[1.06] font-semibold tracking-[-0.025em] text-balance sm:text-5xl lg:text-[56px]">
            {lines.map((line, i) => (
              <span key={i} className={i === 0 ? "block" : "block text-muted"}>
                {line}
              </span>
            ))}
          </h1>
          {hero.subheadline && (
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted text-pretty sm:text-lg">{hero.subheadline}</p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link href={hero.primaryCta.href}>
                {hero.primaryCta.label}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
            </Button>
          </div>
          {(stats.products > 0 || stats.fromPrice) && (
            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-border pt-6">
              {stats.products > 0 && (
                <div>
                  <dt className="eyebrow">In stock now</dt>
                  <dd className="num mt-1 text-xl font-semibold">{stats.products} laptops</dd>
                </div>
              )}
              {stats.fromPrice && (
                <div>
                  <dt className="eyebrow">Prices from</dt>
                  <dd className="num mt-1 text-xl font-semibold">{stats.fromPrice}</dd>
                </div>
              )}
              <div>
                <dt className="eyebrow">Condition</dt>
                <dd className="mt-1 text-xl font-semibold">Graded A+ to C</dd>
              </div>
            </dl>
          )}
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-stage">
            <Image
              src={hero.image || "/images/home/hero.webp"}
              alt={hero.imageAlt || "Refurbished laptops"}
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
          </div>
          {hero.checklist.length > 0 && (
            <div className="animate-fade-in relative -mt-10 mr-3 ml-auto w-[min(100%,300px)] rounded-xl border border-border bg-surface/95 p-4 shadow-lift backdrop-blur [animation-delay:150ms] sm:absolute sm:bottom-6 sm:-left-6 sm:mt-0 sm:mr-0 sm:ml-0 lg:-left-10">
              <p className="eyebrow mb-3">{hero.checklistTitle || "Before it ships"}</p>
              <ul className="space-y-2">
                {hero.checklist.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13.5px]">
                    <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
