import { Skeleton } from "@/components/ui/misc";

export default function AccountLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-8 w-64 max-w-full rounded-md" />
        <Skeleton className="h-4 w-80 max-w-full rounded" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
