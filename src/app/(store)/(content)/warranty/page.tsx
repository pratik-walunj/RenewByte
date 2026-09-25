import { CmsPage, cmsPageMetadata } from "@/components/cms/cms-page";

export const generateMetadata = () => cmsPageMetadata("warranty");

export default function WarrantyPage() {
  return <CmsPage slug="warranty" />;
}
