import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export function SessionListItemSkeleton() {
  return (
    <CardContent className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Icon skeleton */}
          <Skeleton className="h-12 w-12 rounded-xl" />

          <div className="flex-1 min-w-0">
            {/* Title skeleton */}
            <Skeleton className="h-5 w-3/4 mb-2" />
            {/* Date skeleton */}
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        {/* Badge/Status skeleton */}
        <div className="text-right">
          <Skeleton className="h-8 w-16 mb-2 ml-auto" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
      </div>
    </CardContent>
  )
}

export function SessionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      <Card className="border-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>
            <SessionListItemSkeleton />
            {i < count - 1 && <Separator />}
          </div>
        ))}
      </Card>
    </div>
  )
}
