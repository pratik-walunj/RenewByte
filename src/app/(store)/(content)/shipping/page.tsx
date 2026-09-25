import { CmsPage, cmsPageMetadata } from "@/components/cms/cms-page";

export const generateMetadata = () => cmsPageMetadata("shipping");

export default function ShippingPage() {
  return <CmsPage slug="shipping" />;
}
