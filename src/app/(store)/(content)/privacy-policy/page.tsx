import { CmsPage, cmsPageMetadata } from "@/components/cms/cms-page";

export const generateMetadata = () => cmsPageMetadata("privacy-policy");

export default function PrivacyPolicyPage() {
  return <CmsPage slug="privacy-policy" />;
}
