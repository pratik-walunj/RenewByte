import { ProductGridSkeleton } from "@/components/product/skeletons";

export default function Loading() {
  return (
    <>
      <div className="border-b border-border bg-surface">
        <div className="container-page py-10">
          <div className="skeleton mb-5 h-3 w-32" />
          <div className="skeleton h-9 w-72 max-w-full" />
          <div className="skeleton mt-4 h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-2.5 border-b border-border pb-4">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-3 w-40" />
              <div className="skeleton h-3 w-32" />
            </div>
          ))}
        </div>
        <div>
          <div className="mb-5 flex justify-between">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-10 w-44" />
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </>
  );
}
