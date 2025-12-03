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
    <div className="min-h-screen w-full bg-background pb-24">
      {/* Header */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 pt-6 pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-4xl mx-auto px-4 relative">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/teacher/classrooms')}
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
        {/* Quick Actions & Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick Actions */}
          <Card className="md:col-span-2 border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-primary" />
                New Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2 hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => handleCreateSession('qr')}
                >
                  <QrCode className="h-6 w-6 text-primary" />
                  <span className="font-medium">QR Code</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2 hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => handleCreateSession('manual')}
                >
                  <ClipboardList className="h-6 w-6 text-primary" />
                  <span className="font-medium">Manual</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Students</span>
                <span className="text-xl font-bold">
                  {classroom.studentCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sessions</span>
                <span className="text-xl font-bold">{totalSessions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Avg. Attd.
                </span>
                <span className="text-xl font-bold text-primary">
                  {avgAttendance}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Recent Sessions
          </h2>
          {sessions.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No sessions yet. Start one above!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="border hover:shadow-md transition-all cursor-pointer group"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          session.type === 'QR'
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                        }`}
                      >
                        {session.type === 'QR' ? (
                          <QrCode className="h-5 w-5" />
                        ) : (
                          <ClipboardList className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {session.topic}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.date).toLocaleDateString(
                            undefined,
                            {
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {Math.round(
                          (session.presentStudents / session.totalStudents) *
                            100
                        )}
                        %
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.presentStudents}/{session.totalStudents}{' '}
                        Present
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
