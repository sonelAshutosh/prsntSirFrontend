'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { classroomAPI, attendanceAPI } from '@/lib/api'

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
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [history, setHistory] = useState<
    {
      id: string
      date: string
      topic: string
      status: 'present' | 'absent'
      markedAt: string | null
    }[]
  >([])

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)

        // Redirect if not a student
        if (parsedUser.role !== 'STUDENT') {
          router.push('/teacher/classrooms')
          return
        }

        setUser(parsedUser)
        fetchClassroomDetails()
        fetchAttendanceHistory()
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router, classroomId])

  const fetchClassroomDetails = async () => {
    try {
      const response = await classroomAPI.getById(classroomId)
      if (response.success && response.data) {
        setClassroom(response.data.classroom)
      }
    } catch (error: any) {
      console.error('Error fetching classroom:', error)
      toast.error('Failed to load classroom', {
        description: error.response?.data?.message || 'Please try again later.',
      })
      router.push('/student/classrooms')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAttendanceHistory = async () => {
    try {
      const response = await attendanceAPI.getStudentAttendanceHistory(
        classroomId
      )
      if (response.success) {
        setHistory(response.data.history)
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !classroom) {
    return null
  }

  const presentCount = history.filter((s) => s.status === 'present').length
  const totalSessions = history.length
  const attendanceRate =
    totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0

  return (
    <div className="min-h-screen w-full bg-background pb-24">
      {/* Header */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 pt-6 pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-4xl mx-auto px-4 relative">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/student/classrooms')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">
                {classroom.name}
              </h1>
              <p className="text-muted-foreground text-sm">
                {classroom.subject}
              </p>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {classroom.code}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 -mt-4 relative z-10 space-y-6">
        {/* Attendance Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                Total
              </p>
              <p className="text-2xl font-bold">{totalSessions}</p>
            </CardContent>
          </Card>
          <Card className="border shadow-sm bg-green-500/5 border-green-200 dark:border-green-900">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-green-600 dark:text-green-400 mb-1 uppercase tracking-wider">
                Present
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {presentCount}
              </p>
            </CardContent>
          </Card>
          <Card className="border shadow-sm bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-primary mb-1 uppercase tracking-wider">
                Rate
              </p>
              <p className="text-2xl font-bold text-primary">
                {attendanceRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance History */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Attendance History
          </h2>
          {history.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No attendance records yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {history.map((session) => (
                <Card
                  key={session.id}
                  className="border hover:shadow-md transition-all group"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          session.status === 'present'
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                      >
                        {session.status === 'present' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {session.topic}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {new Date(session.date).toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                          </span>
                          {session.markedAt && (
                            <>
                              <span>•</span>
                              <span>{session.markedAt}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        session.status === 'present' ? 'default' : 'destructive'
                      }
                      className={`capitalize ${
                        session.status === 'present'
                          ? 'bg-green-500 hover:bg-green-600'
                          : ''
                      }`}
                    >
                      {session.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
