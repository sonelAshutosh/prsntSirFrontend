'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Calendar,
  Users,
  QrCode,
  ClipboardList,
  BookOpen,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
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
  studentCount?: number
}

export default function TeacherClassroomDetailPage() {
  const router = useRouter()
  const params = useParams()
  const classroomId = params.id as string

  const [user, setUser] = useState<UserData | null>(null)
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createSessionMode, setCreateSessionMode] = useState<'QR' | 'MANUAL'>(
    'MANUAL'
  )
  const [sessionTopic, setSessionTopic] = useState('')
  const [sessions, setSessions] = useState<
    {
      id: string
      date: string
      type: 'MANUAL' | 'QR'
      status: 'completed' | 'active'
      totalStudents: number
      presentStudents: number
      topic: string
    }[]
  >([])

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
        fetchSessions()
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

  const fetchSessions = async () => {
    try {
      const response = await attendanceAPI.getClassroomSessions(classroomId)
      if (response.success) {
        setSessions(response.data.sessions)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const handleCreateSession = (type: 'qr' | 'manual') => {
    setCreateSessionMode(type === 'qr' ? 'QR' : 'MANUAL')
    setSessionTopic('')
    setIsCreateDialogOpen(true)
  }

  const submitCreateSession = async () => {
    try {
      const response = await attendanceAPI.createSession({
        classroomId,
        mode: createSessionMode,
        topic: sessionTopic,
      })
      if (response.success && response.data) {
        setIsCreateDialogOpen(false)
        if (createSessionMode === 'MANUAL') {
          router.push(
            `/teacher/classrooms/${classroomId}/manual?sessionId=${response.data.session.id}`
          )
        } else {
          toast.info('QR Session Created', {
            description: 'QR code display will be implemented soon.',
          })
          fetchSessions()
        }
      }
    } catch (error: any) {
      toast.error('Failed to create session', {
        description: error.response?.data?.message || 'Please try again.',
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

  const totalSessions = sessions.length
  const avgAttendance =
    sessions.length > 0
      ? Math.round(
          sessions.reduce(
            (acc, s) =>
              acc +
              (s.totalStudents > 0
                ? (s.presentStudents / s.totalStudents) * 100
                : 0),
            0
          ) / sessions.length
        )
      : 0

  return (
    <div className="min-h-screen w-full bg-background pb-24 animate-fade-in">
      {/* Header */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 pt-10 pb-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-6xl mx-auto px-4 relative">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/teacher/classrooms')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight mb-1">
                  {classroom.name}
                </h1>
                <p className="text-lg text-muted-foreground mb-3">
                  {classroom.subject}
                </p>
                {/* <Badge
                  variant="secondary"
                  className="font-mono text-sm px-3 py-1"
                >
                  Code: {classroom.code}
                </Badge> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 -mt-8 relative z-10 space-y-6">
        {/* Quick Actions & Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Quick Actions */}
          <Card className="lg:col-span-2 border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">
                  Create Attendance Session
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto flex flex-col gap-3 hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => handleCreateSession('qr')}
                >
                  <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-semibold">QR Code</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex flex-col gap-3 hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => handleCreateSession('manual')}
                >
                  <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <ClipboardList className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-semibold">Manual</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="space-y-4">
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Students</p>
                    <p className="text-2xl font-bold">
                      {classroom.studentCount || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Sessions</p>
                    <p className="text-2xl font-bold">{totalSessions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground font-medium">
                      Avg. Attendance
                    </p>
                    <p className="text-2xl font-bold">{avgAttendance}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Class Sessions</h2>
          {sessions.length === 0 ? (
            <Card className="border-2 border-dashed shadow-lg">
              <CardContent className="text-center py-16">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No sessions yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first attendance session above
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <Card className="border-2 hover:shadow-lg transition-all">
                {sessions.map((session, index) => (
                  <div key={session.id}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                              session.type === 'QR'
                                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                : 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                            }`}
                          >
                            {session.type === 'QR' ? (
                              <QrCode className="h-6 w-6" />
                            ) : (
                              <ClipboardList className="h-6 w-6" />
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
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {Math.round(
                              (session.presentStudents /
                                session.totalStudents) *
                                100
                            )}
                            %
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {session.presentStudents}/{session.totalStudents}{' '}
                            present
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    {index < sessions.length - 1 && <Separator />}
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Enter a topic for this{' '}
              {createSessionMode === 'QR' ? 'QR Code' : 'Manual'} attendance
              session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Introduction to React"
                value={sessionTopic}
                onChange={(e) => setSessionTopic(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={submitCreateSession}>Create Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
