import * as React from "react";
import Link from "next/link";
import Markdoc, { type Config, type Node, type RenderableTreeNodes } from "@markdoc/markdoc";
import { cn } from "@/lib/utils";

/**
 * Renders Keystatic Markdoc content (fields read with `resolveLinkedFiles: true`
 * come back as `{ node }`). Headings get stable ids so a table of contents can
 * link to them; internal links use next/link; tables scroll on small screens.
 */

/** Accepts the Keystatic `{ node }` wrapper or the bare Markdoc node. */
export type MarkdocField = unknown;
export type Heading = { id: string; text: string; level: number };

function headingSlug(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "section"
  );
}

function nodeText(node: Node): string {
  let text = "";
  for (const child of node.walk()) {
    if (child.type === "text" && typeof child.attributes.content === "string") text += child.attributes.content;
    if (child.type === "code" && typeof child.attributes.content === "string") text += child.attributes.content;
  }
  return text.trim();
}

/** Ids are de-duplicated in document order, identically for rendering and the TOC. */
function idFactory() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = headingSlug(text);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n + 1}` : base;
  };
}

function asNode(content: MarkdocField): Node | null {
  if (!content || typeof content !== "object") return null;
  const candidate = "walk" in content ? content : (content as { node?: unknown }).node;
  return candidate && typeof candidate === "object" && "walk" in candidate ? (candidate as Node) : null;
}

/** h2/h3 headings of a document, for building a table of contents. */
export function markdocHeadings(content: MarkdocField, levels: number[] = [2]): Heading[] {
  const root = asNode(content);
  if (!root) return [];
  const nextId = idFactory();
  const out: Heading[] = [];
  for (const node of root.walk()) {
    if (node.type !== "heading") continue;
    const level = Number(node.attributes.level) || 1;
    const text = nodeText(node);
    const id = nextId(text);
    if (levels.includes(level)) out.push({ id, text, level });
  }
  return out;
}

function buildConfig(): Config {
  const nextId = idFactory();
  return {
    nodes: {
      heading: {
        children: ["inline"],
        attributes: { id: { type: String }, level: { type: Number, required: true, default: 1 } },
        transform(node, config) {
          const { level: _level, ...rest } = node.transformAttributes(config);
          const children = node.transformChildren(config);
          const level = Math.min(Math.max(Number(node.attributes.level) || 2, 2), 6);
          const id = nextId(nodeText(node));
          // Content never renders an h1 — the page title owns it.
          return new Markdoc.Tag(`h${level}`, { ...rest, id }, children);
        },
      },
      link: {
        children: ["strong", "em", "s", "code", "text", "tag"],
        attributes: { href: { type: String, required: true }, title: { type: String } },
        transform(node, config) {
          const attributes = node.transformAttributes(config);
          const children = node.transformChildren(config);
          const href = String(attributes.href ?? "");
          if (href.startsWith("/") || href.startsWith("#")) {
            return new Markdoc.Tag("InternalLink", { href, title: attributes.title }, children);
          }
          return new Markdoc.Tag("a", { href, title: attributes.title, target: "_blank", rel: "noopener noreferrer" }, children);
        },
      },
      table: {
        children: ["thead", "tbody"],
        transform(node, config) {
          const children = node.transformChildren(config);
          return new Markdoc.Tag("div", { class: "not-prose-scroll overflow-x-auto" }, [
            new Markdoc.Tag("table", {}, children),
          ]);
        },
      },
    },
  };
}

function InternalLink({ href, title, children }: { href: string; title?: string; children?: React.ReactNode }) {
  return (
    <Link href={href} title={title}>
      {children}
    </Link>
  );
}

export const proseClass = cn(
  "prose prose-slate max-w-[72ch] text-[16px] leading-relaxed text-foreground/90",
  "prose-headings:scroll-mt-28 prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground prose-headings:text-balance",
  "prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-[1.6rem] prose-h3:mt-8 prose-h3:text-[1.2rem]",
  "prose-p:text-pretty prose-strong:text-foreground prose-li:my-1 prose-li:marker:text-faint",
  "prose-a:font-medium prose-a:text-accent prose-a:underline-offset-4 prose-a:decoration-accent/30 hover:prose-a:decoration-accent",
  "prose-code:rounded prose-code:bg-subtle prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.88em] prose-code:font-medium prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
  "prose-pre:rounded-xl prose-pre:bg-primary prose-pre:text-[13px]",
  "prose-blockquote:border-l-accent prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-muted",
  "prose-hr:border-border",
  "prose-table:my-0 prose-table:text-[14px] prose-thead:border-border-strong prose-th:bg-subtle prose-th:px-3 prose-th:py-2.5 prose-th:text-left prose-th:font-semibold prose-td:px-3 prose-td:py-2.5 prose-tr:border-border",
  "[&_.not-prose-scroll]:my-8 [&_.not-prose-scroll]:rounded-xl [&_.not-prose-scroll]:border [&_.not-prose-scroll]:border-border",
  "prose-img:rounded-xl",
);

export function MarkdocContent({
  node: content,
  className,
  wide = false,
}: {
  /** Keystatic markdoc value (`{ node }`) or the bare node; null renders nothing. */
  node: MarkdocField;
  className?: string;
  /** Remove the reading-width cap. */
  wide?: boolean;
}) {
  const node = asNode(content);
  if (!node) return null;
  const tree = Markdoc.transform(node, buildConfig()) as RenderableTreeNodes;
  return (
    <div className={cn(proseClass, wide && "max-w-none", className)}>
      {Markdoc.renderers.react(tree, React, { components: { InternalLink } })}
    </div>
  );
}
