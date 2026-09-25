import { notFound } from "next/navigation";
import { getPage } from "@/lib/cms";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/layout/page-shell";
import { MarkdocContent, markdocHeadings } from "@/components/cms/markdoc";
import { TableOfContents } from "@/components/cms/table-of-contents";
import { HelpBlock } from "@/components/cms/help-block";

/**
 * One renderer for every CMS-managed static page (about, policies, careers).
 * Pages live in content/pages/<slug>.mdoc and are edited in Keystatic.
 */

export async function cmsPageMetadata(slug: string, path = `/${slug}`) {
  const page = await getPage(slug);
  if (!page) return pageMetadata({ title: "Page not found", path, noindex: true });
  return pageMetadata({
    title: page.seo.title || page.title,
    description: page.seo.description || page.subtitle,
    path,
  });
}

export async function CmsPage({
  slug,
  path = `/${slug}`,
  eyebrow,
  before,
  after,
}: {
  slug: string;
  path?: string;
  eyebrow?: string;
  /** Rendered above the article body (inside the reading column). */
  before?: React.ReactNode;
  /** Rendered full-width below the article. */
  after?: React.ReactNode;
}) {
  const page = await getPage(slug);
  if (!page) notFound();

  const headings = markdocHeadings(page.content);

  return (
    <>
      <PageHeader
        title={page.title}
        description={page.subtitle}
        eyebrow={eyebrow}
        crumbs={[{ name: page.title, path }]}
      >
        {page.updatedAt && (
          <p className="mt-4 font-mono text-xs text-faint">
            Last updated <time dateTime={page.updatedAt}>{formatDate(page.updatedAt)}</time>
          </p>
        )}
      </PageHeader>

      <div className="container-page py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16">
          <div className="min-w-0">
            {before}
            {headings.length > 1 && (
              <details className="mb-8 rounded-xl border border-border bg-surface px-4 py-3 lg:hidden">
                <summary className="cursor-pointer text-sm font-medium">On this page</summary>
                <ol className="mt-3 space-y-2 text-sm">
                  {headings.map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`} className="text-muted hover:text-foreground">
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            )}
            <MarkdocContent node={page.content} />
            {page.showContactCta && <HelpBlock className="mt-12 max-w-[72ch]" location={`page_${slug}`} />}
          </div>
          <aside className="hidden lg:block">
            <TableOfContents headings={headings} className="sticky top-28" />
          </aside>
        </div>
      </div>

      {after}
    </>
  );
}
