import { CmsPage, cmsPageMetadata } from "@/components/cms/cms-page";

export const generateMetadata = () => cmsPageMetadata("careers");

export default function CareersPage() {
  return <CmsPage slug="careers" />;
}
