import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function StatsSkeleton() {
  return (
    <Card className="border-2 shadow-lg">
      <CardContent className="p-0">
        <div className="grid grid-cols-3 divide-x">
          {/* Stat 1 */}
          <div className="p-4 sm:p-6 text-center flex flex-col items-center">
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl mb-2 sm:mb-3" />
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>

          {/* Stat 2 */}
          <div className="p-4 sm:p-6 text-center flex flex-col items-center">
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl mb-2 sm:mb-3" />
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>

          {/* Stat 3 */}
          <div className="p-4 sm:p-6 text-center flex flex-col items-center">
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl mb-2 sm:mb-3" />
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
