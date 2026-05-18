import { Skeleton } from "@/components/ui/skeleton"

export function SearchResultsSkeleton() {
  return (
    <div className="mt-8">
      <Skeleton className="mb-4 h-5 w-20" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 18 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl bg-card">
            <Skeleton className="aspect-[2/3] w-full rounded-none" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
