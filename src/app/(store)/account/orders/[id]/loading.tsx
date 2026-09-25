import { Skeleton } from "@/components/ui/misc";

export default function AccountOrderLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading order">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-8 w-60 max-w-full rounded-md" />
        <Skeleton className="h-4 w-44 rounded" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="space-y-5 rounded-xl border border-border bg-surface p-5">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="size-7 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
            ))}
          </div>
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
