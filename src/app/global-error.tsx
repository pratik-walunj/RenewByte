"use client";

import "./globals.css";

/** Last-resort boundary (errors in the root layout). Must render its own <html>. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body className="flex min-h-dvh items-center justify-center bg-background px-4 font-sans text-foreground">
        <div className="max-w-md text-center">
          <p className="font-mono text-sm text-muted">Error 500</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-3 text-[15px] text-muted">Please refresh the page. If the problem continues, try again in a few minutes.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Try again
          </button>
          {error.digest && <p className="mt-6 font-mono text-xs text-faint">Reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
