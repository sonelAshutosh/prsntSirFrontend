'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  BookOpen,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { classroomAPI, attendanceAPI } from '@/lib/api'
import { useClassroom, useAttendanceHistory } from '@/lib/hooks/use-api'
import { StatsSkeleton } from '@/components/skeletons/stats-skeleton'
import { SessionListSkeleton } from '@/components/skeletons/session-list-skeleton'

interface UserData {
  _id?: string
  id?: string
  firstName: string
  lastName: string
  email: string
  role: 'TEACHER' | 'STUDENT'
  profileImage?: string
}

interface Classroom {
  id: string
  name: string
  subject: string
  code: string
}

export default function StudentClassroomDetailPage() {
  const router = useRouter()
  const params = useParams()
  const classroomId = params.id as string

  const [user, setUser] = useState<UserData | null>(null)

  // Use SWR for data fetching
  const {
    classroom,
    isLoading: isLoadingClassroom,
    error: classroomError,
  } = useClassroom(classroomId)
  const { history, isLoading: isLoadingHistory } =
    useAttendanceHistory(classroomId)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)

        if (parsedUser.role !== 'STUDENT') {
          router.push('/teacher/classrooms')
          return
        }

        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router, classroomId])

  // Redirect if classroom fetch fails
  useEffect(() => {
    if (classroomError) {
      toast.error('Failed to load classroom', {
        description: 'Please try again later.',
      })
      router.push('/student/classrooms')
    }
  }, [classroomError, router])

  // Show loading skeleton while data is being fetched
  const isLoading = isLoadingClassroom || isLoadingHistory
  const totalSessions = history?.length || 0
  const presentCount =
    history?.filter((h) => h.status === 'present').length || 0
  const attendanceRate =
    totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0

  if (!user) {
    return null
  }

  // Show full page loading skeleton while initial data loads
  if (!classroom || isLoading) {
    return (
      <div className="min-h-screen w-full bg-background pb-24">
        {/* Header Skeleton */}
        <div className="relative bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 pt-10 pb-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
          <div className="container max-w-5xl mx-auto px-4 relative">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-muted/50 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-8 w-2/3 bg-muted/50 rounded animate-pulse" />
                <div className="h-5 w-1/3 bg-muted/50 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Content with Skeletons */}
        <div className="container w-full mx-auto px-4 -mt-8 relative z-10 space-y-6">
          <StatsSkeleton />
          <div className="space-y-4">
            <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
            <SessionListSkeleton count={5} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background pb-24 animate-fade-in">
      {/* Header */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 pt-10 pb-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-5xl mx-auto px-4 relative">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/student/classrooms')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Button>
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight mb-1">
                {classroom.name}
              </h1>
              <p className="text-lg text-muted-foreground">
                {classroom.subject}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container w-full mx-auto px-4 -mt-8 relative z-10 space-y-6">
        {/* Attendance Stats */}
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-0">
            <div className="grid grid-cols-3 divide-x">
              {/* Total Sessions */}
              <div className="p-4 sm:p-6 text-center flex flex-col items-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-2 sm:mb-3">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Sessions
                </p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">
                  {totalSessions}
                </p>
              </div>

              {/* Present */}
              <div className="p-4 sm:p-6 text-center flex flex-col items-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-2 sm:mb-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 " />
                </div>
                <p className="text-xs sm:text-sm font-medium ">
                  Sessions Present
                </p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">
                  {presentCount}
                </p>
              </div>

              {/* Attendance Rate */}
              <div className="p-4 sm:p-6 text-center flex flex-col items-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-2 sm:mb-3">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <p className="text-xs sm:text-sm font-medium">
                  Attendance Rate
                </p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">
                  {attendanceRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Attendance History
          </h2>
          {history && history.length === 0 ? (
            <Card className="border-2 border-dashed shadow-lg">
              <CardContent className="text-center py-16">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No sessions yet</h3>
                <p className="text-muted-foreground">
                  Your attendance history will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <Card className="border-2 hover:shadow-lg transition-all">
                {history?.map((session, index) => (
                  <div key={session.id}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                              session.status === 'present'
                                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                : 'bg-red-500/20 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {session.status === 'present' ? (
                              <CheckCircle2 className="h-6 w-6" />
                            ) : (
                              <XCircle className="h-6 w-6" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1">
                              {session.topic}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(session.date).toLocaleDateString(
                                undefined,
                                {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            session.status === 'present'
                              ? 'default'
                              : 'destructive'
                          }
                          className="text-sm px-3 py-1"
                        >
                          {session.status === 'present' ? 'Present' : 'Absent'}
                        </Badge>
                      </div>
                    </CardContent>
                    {history && index < history.length - 1 && <Separator />}
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
