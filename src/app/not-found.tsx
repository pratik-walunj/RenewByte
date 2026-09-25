import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { NotFoundContent } from "@/components/errors/not-found-content";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function RootNotFound() {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="container-page flex h-16 items-center">
          <Logo />
        </div>
      </header>
      <main>
        <NotFoundContent />
      </main>
    </>
  );
}
