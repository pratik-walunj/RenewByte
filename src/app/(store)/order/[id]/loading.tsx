import { Skeleton } from "@/components/ui/misc";

export default function OrderLoading() {
  return (
    <div className="container-page py-10 sm:py-14" aria-busy="true" aria-label="Loading your order">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-8 w-72 max-w-full rounded-md" />
          <Skeleton className="h-4 w-56 max-w-full rounded" />
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}
