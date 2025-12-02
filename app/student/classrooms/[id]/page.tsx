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
import { classroomAPI } from '@/lib/api'

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

  // Mock attendance data - will be replaced with real data later
  const mockAttendanceSessions = [
    {
      id: '1',
      date: '2025-12-02',
      topic: 'Introduction to React',
      status: 'present',
      markedAt: '09:15 AM',
    },
    {
      id: '2',
      date: '2025-11-30',
      topic: 'State Management',
      status: 'present',
      markedAt: '09:12 AM',
    },
    {
      id: '3',
      date: '2025-11-28',
      topic: 'Component Lifecycle',
      status: 'absent',
      markedAt: null,
    },
  ]

  const presentCount = mockAttendanceSessions.filter(
    (s) => s.status === 'present'
  ).length
  const totalSessions = mockAttendanceSessions.length
  const attendanceRate =
    totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0

  return (
    <div className="min-h-screen w-full bg-background pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 pt-8 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-4xl mx-auto px-4 relative">
          <Button
            variant="ghost"
            className="mb-4 gap-2"
            onClick={() => router.push('/student/classrooms')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Classes
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {classroom.name}
          </h1>
          <p className="text-muted-foreground mb-4">{classroom.subject}</p>
          <Badge variant="secondary" className="font-mono">
            {classroom.code}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 -mt-8 relative z-10 space-y-6">
        {/* Attendance Stats */}
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Attendance Overview
            </CardTitle>
            <CardDescription>
              Your attendance statistics for this class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Total Sessions
                </p>
                <p className="text-3xl font-bold text-primary">
                  {totalSessions}
                </p>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Present</p>
                <p className="text-3xl font-bold text-green-600">
                  {presentCount}
                </p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Attendance Rate
                </p>
                <p className="text-3xl font-bold text-primary">
                  {attendanceRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Attendance History
            </CardTitle>
            <CardDescription>
              All attendance sessions for this class
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mockAttendanceSessions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No attendance sessions yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {mockAttendanceSessions.map((session) => (
                  <Card key={session.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{session.topic}</h4>
                            {session.status === 'present' ? (
                              <Badge className="bg-green-500 hover:bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Present
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Absent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.date).toLocaleDateString(
                              'en-US',
                              {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )}
                          </p>
                          {session.markedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Marked at: {session.markedAt}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
