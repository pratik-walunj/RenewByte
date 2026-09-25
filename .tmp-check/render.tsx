import { createReader } from "@keystatic/core/reader";
import { renderToStaticMarkup } from "react-dom/server";
import config from "../keystatic.config";
import { MarkdocContent, markdocHeadings } from "../src/components/cms/markdoc";
const r = createReader(process.cwd(), config);
(async () => {
  const p = await r.collections.posts.read("best-refurbished-laptops-under-30000", { resolveLinkedFiles: true });
  console.log(markdocHeadings(p!.content));
  const html = renderToStaticMarkup(<MarkdocContent node={p!.content} />);
  console.log(html.slice(0, 400)); console.log(html.match(/<table[\s\S]{0,200}/)?.[0]); console.log(html.match(/<a [^>]*>/g)?.slice(0,3));
})();
