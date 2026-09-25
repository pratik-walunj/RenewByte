import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NotFoundContent() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-mono text-sm font-medium text-muted">Error 404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">We couldn&apos;t find that page</h1>
      <p className="mt-3 max-w-md text-[15px] text-muted text-pretty">
        The laptop may have sold — refurbished stock is often one of a kind — or the link may be out of date.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/laptops">Browse laptops</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go to homepage</Link>
        </Button>
      </div>
      <p className="mt-8 text-sm text-muted">
        Looking for an order?{" "}
        <Link href="/track-order" className="font-medium text-accent hover:underline">
          Track it here
        </Link>
      </p>
    </div>
  );
}
