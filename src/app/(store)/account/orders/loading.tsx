import { Skeleton } from "@/components/ui/misc";

export default function AccountOrdersLoading() {
  return (
    <div aria-busy="true" aria-label="Loading orders">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-4 w-64 max-w-full rounded" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-border bg-surface p-4">
            <Skeleton className="size-16 shrink-0 rounded-lg sm:size-20" />
            <div className="flex-1 space-y-2.5 py-1">
              <Skeleton className="h-4 w-44 max-w-full rounded" />
              <Skeleton className="h-4 w-full max-w-sm rounded" />
              <Skeleton className="h-3.5 w-52 max-w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
