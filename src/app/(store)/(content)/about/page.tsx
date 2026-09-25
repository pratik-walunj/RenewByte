import Link from "next/link";
import { getRefurbishProcess } from "@/lib/cms";
import { CmsPage, cmsPageMetadata } from "@/components/cms/cms-page";
import { TrustGrid } from "@/components/cms/trust-grid";
import { SectionHeading } from "@/components/ui/misc";
import { buttonVariants } from "@/components/ui/button";

export const generateMetadata = () => cmsPageMetadata("about");

export default async function AboutPage() {
  const process = await getRefurbishProcess();
  const commitments = process?.commitments ?? [];

  return (
    <CmsPage
      slug="about"
      eyebrow="About us"
      after={
        commitments.length > 0 && (
          <section aria-labelledby="about-trust" className="border-t border-border bg-surface">
            <div className="container-page py-14 sm:py-20">
              <SectionHeading
                id="about-trust"
                eyebrow="Our commitments"
                title="What you can expect from every order"
                subtitle="The same standards apply to every laptop we sell, whatever its grade or price."
              />
              <TrustGrid items={commitments} />
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/laptops" className={buttonVariants({ size: "lg" })}>
                  Shop refurbished laptops
                </Link>
                <Link href="/how-we-refurbish" className={buttonVariants({ variant: "outline", size: "lg" })}>
                  How we refurbish
                </Link>
              </div>
            </div>
          </section>
        )
      }
    />
  );
}
