export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface" aria-hidden>
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-4">
        <div className="flex justify-between">
          <div className="skeleton h-3 w-12" />
          <div className="skeleton h-5 w-16" />
        </div>
        <div className="skeleton h-4 w-11/12" />
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton mt-4 h-6 w-1/2" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton mt-3 h-10 w-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4" role="status" aria-label="Loading laptops">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container-page py-8" role="status" aria-label="Loading product">
      <div className="skeleton mb-6 h-3 w-64 max-w-full" />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div>
          <div className="skeleton aspect-[4/3] rounded-2xl" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton size-16 sm:size-20" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-8 w-4/5" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-10 w-40" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
