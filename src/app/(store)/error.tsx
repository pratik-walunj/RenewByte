"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-mono text-sm font-medium text-muted">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">This page didn&apos;t load properly</h1>
      <p className="mt-3 max-w-md text-[15px] text-muted text-pretty">
        It&apos;s on our side, not yours. Please try again — if it keeps happening, contact us and we&apos;ll help you complete your order.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCw /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">Contact support</Link>
        </Button>
      </div>
      {error.digest && <p className="mt-6 font-mono text-xs text-faint">Reference: {error.digest}</p>}
    </div>
  );
}
