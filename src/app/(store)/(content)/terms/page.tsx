import { CmsPage, cmsPageMetadata } from "@/components/cms/cms-page";

export const generateMetadata = () => cmsPageMetadata("terms");

export default function TermsPage() {
  return <CmsPage slug="terms" />;
}
