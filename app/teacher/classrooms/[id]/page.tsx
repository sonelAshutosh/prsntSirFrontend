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
import {
  ArrowLeft,
  Calendar,
  PlusCircle,
  Users,
  QrCode,
  ClipboardList,
  ChevronRight,
} from 'lucide-react'
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

export default function TeacherClassroomDetailPage() {
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

        // Redirect if not a teacher
        if (parsedUser.role !== 'TEACHER') {
          router.push('/student/classrooms')
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
      router.push('/teacher/classrooms')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSession = (type: 'qr' | 'manual') => {
    if (type === 'manual') {
      router.push(`/teacher/classrooms/${classroomId}/manual`)
    } else {
      toast.info('Coming soon!', {
        description: 'QR-based attendance session will be implemented soon.',
      })
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

  // Mock attendance sessions data - will be replaced with real data later
  const mockAttendanceSessions = [
    {
      id: '1',
      date: '2025-12-02',
      topic: 'Introduction to React',
      type: 'qr',
      totalStudents: 30,
      presentStudents: 28,
      status: 'completed',
    },
    {
      id: '2',
      date: '2025-11-30',
      topic: 'State Management',
      type: 'manual',
      totalStudents: 30,
      presentStudents: 25,
      status: 'completed',
    },
    {
      id: '3',
      date: '2025-11-28',
      topic: 'Component Lifecycle',
      type: 'qr',
      totalStudents: 30,
      presentStudents: 29,
      status: 'completed',
    },
  ]

  const totalSessions = mockAttendanceSessions.length
  const avgAttendance =
    mockAttendanceSessions.length > 0
      ? Math.round(
          mockAttendanceSessions.reduce(
            (acc, s) => acc + (s.presentStudents / s.totalStudents) * 100,
            0
          ) / mockAttendanceSessions.length
        )
      : 0

  return (
    <div className="min-h-screen w-full bg-background pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 pt-8 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-4xl mx-auto px-4 relative">
          <Button
            variant="ghost"
            className="mb-4 gap-2"
            onClick={() => router.push('/teacher/classrooms')}
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
        {/* Quick Actions */}
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary" />
              Create Attendance Session
            </CardTitle>
            <CardDescription>
              Start a new attendance session for this class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card
                className="border-2 hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
                onClick={() => handleCreateSession('qr')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <QrCode className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">QR Code Session</h3>
                      <p className="text-sm text-muted-foreground">
                        Students scan QR to mark attendance
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="border-2 hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
                onClick={() => handleCreateSession('manual')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Manual Session</h3>
                      <p className="text-sm text-muted-foreground">
                        Mark attendance manually
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Class Statistics
            </CardTitle>
            <CardDescription>
              Overview of attendance for this class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Total Sessions
                </p>
                <p className="text-3xl font-bold text-primary">
                  {totalSessions}
                </p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Avg. Attendance
                </p>
                <p className="text-3xl font-bold text-primary">
                  {avgAttendance}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Sessions */}
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Attendance Sessions
            </CardTitle>
            <CardDescription>
              All attendance sessions for this class
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mockAttendanceSessions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No attendance sessions yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Create your first session to start tracking attendance
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
                            <Badge
                              variant={
                                session.type === 'qr' ? 'default' : 'secondary'
                              }
                            >
                              {session.type === 'qr' ? (
                                <>
                                  <QrCode className="h-3 w-3 mr-1" />
                                  QR Code
                                </>
                              ) : (
                                <>
                                  <ClipboardList className="h-3 w-3 mr-1" />
                                  Manual
                                </>
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
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
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              <Users className="h-4 w-4 inline mr-1" />
                              {session.presentStudents}/{session.totalStudents}{' '}
                              students
                            </span>
                            <span className="font-medium text-primary">
                              {Math.round(
                                (session.presentStudents /
                                  session.totalStudents) *
                                  100
                              )}
                              % attendance
                            </span>
                          </div>
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
