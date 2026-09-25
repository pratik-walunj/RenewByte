import Link from "next/link";
import { getSiteSettings } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/layout/page-shell";
import { TrackOrderForm } from "@/components/orders/track-order-form";

export async function generateMetadata() {
  return pageMetadata({
    title: "Track your order",
    description:
      "Check the delivery status of your refurbished laptop order. Enter your order number and the email or phone you ordered with to see live progress and courier tracking.",
    path: "/track-order",
  });
}

type SearchParams = Promise<{ order?: string | string[] }>;

export default async function TrackOrderPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ order }, site] = await Promise.all([searchParams, getSiteSettings()]);
  const initial = typeof order === "string" && /^RB-[A-Za-z0-9-]{4,20}$/.test(order) ? order.toUpperCase() : "";

  const help = [
    {
      q: "Where do I find my order number?",
      a: "It's in the confirmation email we sent after you placed the order, and it starts with RB-.",
    },
    {
      q: "When will I get a tracking number?",
      a: "As soon as your laptop is handed to the courier, we add the courier name and tracking number here and email it to you.",
    },
    {
      q: "Have an account?",
      a: (
        <>
          <Link href="/login?next=/account/orders" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>{" "}
          to see every order you&apos;ve placed and its full details.
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Track order", path: "/track-order" }]}
        eyebrow="Order status"
        title="Track your order"
        description="Enter your order number and the email or phone number you used at checkout."
      />
      <div className="container-page py-8 sm:py-12">
        <TrackOrderForm initialOrderNumber={initial} />

        <section aria-labelledby="track-help" className="mt-14 border-t border-border pt-10">
          <h2 id="track-help" className="mb-6 text-lg font-semibold tracking-tight">
            Help with tracking
          </h2>
          <dl className="grid gap-6 sm:grid-cols-3">
            {help.map((h) => (
              <div key={h.q}>
                <dt className="text-sm font-medium">{h.q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{h.a}</dd>
              </div>
            ))}
          </dl>
          {(site.email || site.phone) && (
            <p className="mt-8 text-sm text-muted">
              Still stuck? Contact us
              {site.phone && (
                <>
                  {" "}
                  on{" "}
                  <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="font-medium text-foreground hover:underline">
                    {site.phone}
                  </a>
                </>
              )}
              {site.email && (
                <>
                  {site.phone ? " or " : " at "}
                  <a href={`mailto:${site.email}`} className="font-medium text-foreground hover:underline">
                    {site.email}
                  </a>
                </>
              )}
              .
            </p>
          )}
        </section>
      </div>
    </>
  );
}
