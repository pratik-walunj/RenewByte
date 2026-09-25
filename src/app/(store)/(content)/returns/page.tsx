import { CmsPage, cmsPageMetadata } from "@/components/cms/cms-page";

export const generateMetadata = () => cmsPageMetadata("returns");

export default function ReturnsPage() {
  return <CmsPage slug="returns" />;
}
