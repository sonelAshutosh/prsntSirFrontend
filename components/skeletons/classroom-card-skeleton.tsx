import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ClassroomCardSkeleton() {
  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          {/* Avatar skeleton */}
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />

          <div className="flex-1 min-w-0">
            {/* Title skeleton */}
            <Skeleton className="h-6 w-3/4 mb-2" />
            {/* Subtitle skeleton */}
            <Skeleton className="h-4 w-1/2" />
          </div>

          {/* Button skeleton */}
          <Skeleton className="h-9 w-9 rounded-md shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ClassroomCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ClassroomCardSkeleton key={i} />
      ))}
    </div>
  )
}
