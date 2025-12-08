'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { mutate } from 'swr'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ArrowLeft,
  Calendar,
  Users,
  QrCode,
  ClipboardList,
  BookOpen,
  TrendingUp,
  BarChart3,
  UserPlus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { classroomAPI, attendanceAPI } from '@/lib/api'
import {
  useClassroom,
  useClassroomSessions,
  useActiveSession,
} from '@/lib/hooks/use-api'
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
  studentCount?: number
}

export default function TeacherClassroomDetailPage() {
  const router = useRouter()
  const params = useParams()
  const classroomId = params.id as string

  const [user, setUser] = useState<UserData | null>(null)
  const [activeTab, setActiveTab] = useState('sessions')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createSessionMode, setCreateSessionMode] = useState<'QR' | 'MANUAL'>(
    'MANUAL'
  )
  const [sessionTopic, setSessionTopic] = useState('')

  // Co-teacher management
  const [manageCoTeachersOpen, setManageCoTeachersOpen] = useState(false)
  const [coTeacherEmail, setCoTeacherEmail] = useState('')
  const [isAddingCoTeacher, setIsAddingCoTeacher] = useState(false)

  // Code regeneration
  const [regenerateCodeOpen, setRegenerateCodeOpen] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Delete classroom
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeletingClass, setIsDeletingClass] = useState(false)

  // Use SWR hooks for data fetching
  const {
    classroom,
    isLoading: isLoadingClassroom,
    error: classroomError,
  } = useClassroom(classroomId)
  const {
    sessions,
    isLoading: isLoadingSessions,
    mutate: mutateSessions,
  } = useClassroomSessions(classroomId)
  const {
    activeSession,
    isLoading: isLoadingActiveSession,
    mutate: mutateActiveSession,
  } = useActiveSession(classroomId)

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
      router.push('/teacher/classrooms')
    }
  }, [classroomError, router])

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
        // Revalidate active session and sessions list
        mutateActiveSession()
        mutateSessions()
        if (createSessionMode === 'MANUAL') {
          router.push(
            `/teacher/classrooms/${classroomId}/manual?sessionId=${response.data.session.id}`
          )
        } else {
          // Redirect to QR scanner page
          router.push(
            `/teacher/classrooms/${classroomId}/qr-scan/${response.data.session.id}`
          )
        }
      }
    } catch (error: any) {
      // Check if error is due to active session
      if (error.response?.data?.data?.activeSession) {
        // Revalidate to get the latest active session
        mutateActiveSession()
        setIsCreateDialogOpen(false)
      }
      toast.error('Failed to create session', {
        description: error.response?.data?.message || 'Please try again.',
      })
    }
  }

  const handleResumeSession = () => {
    if (!activeSession) return

    if (activeSession.mode === 'MANUAL') {
      router.push(
        `/teacher/classrooms/${classroomId}/manual?sessionId=${activeSession.id}`
      )
    } else {
      router.push(
        `/teacher/classrooms/${classroomId}/qr-scan/${activeSession.id}`
      )
    }
  }

  const handleRegenerateCode = async () => {
    if (!classroom) return

    setIsRegenerating(true)
    try {
      const response = await classroomAPI.regenerateCode(classroom.id)
      if (response.success && response.data) {
        toast.success('Code regenerated!', {
          description: `New code: ${response.data.classroom.code}`,
        })
        setRegenerateCodeOpen(false)
        // Revalidate classroom data
        mutate(['classroom', classroomId])
      }
    } catch (error: any) {
      console.error('Error regenerating code:', error)
      toast.error('Failed to regenerate code', {
        description: error.response?.data?.message || 'Please try again.',
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleAddCoTeacher = async () => {
    if (!classroom || !coTeacherEmail) {
      toast.error('Validation error', {
        description: 'Please enter a teacher email',
      })
      return
    }

    setIsAddingCoTeacher(true)
    try {
      const response = await classroomAPI.addCoTeacher(
        classroom.id,
        coTeacherEmail
      )
      if (response.success && response.data) {
        toast.success('Co-teacher added!', {
          description: `${coTeacherEmail} has been added as a co-teacher`,
        })
        setCoTeacherEmail('')
        // Revalidate classroom data
        mutate(['classroom', classroomId])
      }
    } catch (error: any) {
      console.error('Error adding co-teacher:', error)
      toast.error('Failed to add co-teacher', {
        description: error.response?.data?.message || 'Please try again.',
      })
    } finally {
      setIsAddingCoTeacher(false)
    }
  }

  const handleRemoveCoTeacher = async (teacherId: string) => {
    if (!classroom) return

    try {
      const response = await classroomAPI.removeCoTeacher(
        classroom.id,
        teacherId
      )
      if (response.success && response.data) {
        toast.success('Co-teacher removed!', {
          description: 'Co-teacher has been removed from the classroom',
        })
        // Revalidate classroom data
        mutate(['classroom', classroomId])
      }
    } catch (error: any) {
      console.error('Error removing co-teacher:', error)
      toast.error('Failed to remove co-teacher', {
        description: error.response?.data?.message || 'Please try again.',
      })
    }
  }

  const handleDeleteClassroom = async () => {
    if (!classroom) return

    // Check if user typed the classroom name correctly
    if (deleteConfirmText !== classroom.name) {
      toast.error('Confirmation failed', {
        description: 'Please type the classroom name exactly as shown',
      })
      return
    }

    setIsDeletingClass(true)
    try {
      const response = await classroomAPI.delete(classroom.id)
      if (response.success) {
        toast.success('Classroom deleted', {
          description: 'All related data has been permanently deleted',
        })
        router.push('/teacher/classrooms')
      }
    } catch (error: any) {
      console.error('Error deleting classroom:', error)
      toast.error('Failed to delete classroom', {
        description: error.response?.data?.message || 'Please try again.',
      })
    } finally {
      setIsDeletingClass(false)
    }
  }

  // Combine loading states
  const isLoading =
    isLoadingClassroom || isLoadingSessions || isLoadingActiveSession

  if (!user) {
    return null
  }

  if (isLoading || !classroom) {
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

  const totalSessions = sessions?.length || 0
  const avgAttendance =
    sessions && sessions.length > 0
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
                <p className="text-lg text-muted-foreground">
                  {classroom.subject}
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              onClick={() => {
                setCreateSessionMode('QR')
                setIsCreateDialogOpen(true)
              }}
              size="icon"
              className="h-11 w-11 rounded-full shadow-md hover:shadow-lg transition-all"
              title="QR Session"
            >
              <QrCode className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => {
                setCreateSessionMode('MANUAL')
                setIsCreateDialogOpen(true)
              }}
              size="icon"
              variant="outline"
              className="h-11 w-11 rounded-full shadow-md hover:shadow-lg transition-all"
              title="Manual Session"
            >
              <ClipboardList className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setManageCoTeachersOpen(true)}
              size="icon"
              variant="outline"
              className="h-11 w-11 rounded-full shadow-md hover:shadow-lg transition-all"
              title="Add Co-Teacher"
            >
              <UserPlus className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setRegenerateCodeOpen(true)}
              size="icon"
              variant="outline"
              className="h-11 w-11 rounded-full shadow-md hover:shadow-lg transition-all"
              title="Regenerate Code"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 -mt-8 relative z-10 space-y-6">
        {/* Active Session Banner */}
        {activeSession && (
          <Card className="border-2 bg-linear-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  {/* QR Icon */}
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                    {activeSession.mode === 'QR' ? (
                      <QrCode className="h-8 w-8 text-primary" />
                    ) : (
                      <ClipboardList className="h-8 w-8 text-primary" />
                    )}
                  </div>

                  {/* Session Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary border-0 font-medium px-2.5 py-0.5 text-xs"
                      >
                        {activeSession.mode}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-0.5">
                      {activeSession.topic}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Started{' '}
                      {new Date(activeSession.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Resume Button */}
                <Button
                  onClick={handleResumeSession}
                  className="shadow-md hover:shadow-lg transition-all px-8 py-6 text-base font-semibold rounded-full"
                  size="lg"
                >
                  Resume Session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Navigation */}
        <Tabs
          defaultValue="sessions"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full justify-start gap-1 bg-muted/50 backdrop-blur-sm p-2 rounded-xl h-14">
            <TabsTrigger
              value="sessions"
              className="rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md"
            >
              Sessions
            </TabsTrigger>
            <TabsTrigger
              value="students"
              className="rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md"
            >
              Students
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md"
            >
              Stats
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            {!sessions || sessions.length === 0 ? (
              <Card className="border border-dashed">
                <CardContent className="text-center py-12">
                  <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    No sessions yet. Use the buttons above to create one.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border overflow-hidden">
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              session.type === 'QR'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            }`}
                          >
                            {session.type === 'QR' ? (
                              <QrCode className="h-5 w-5" />
                            ) : (
                              <ClipboardList className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">
                              {session.topic}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.date).toLocaleDateString(
                                undefined,
                                {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {session.totalStudents > 0
                              ? Math.round(
                                  (session.presentStudents /
                                    session.totalStudents) *
                                    100
                                )
                              : 0}
                            %
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {session.presentStudents}/{session.totalStudents}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    {index < sessions.length - 1 && <Separator />}
                  </div>
                ))}
              </Card>
            )}
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card className="border">
              <CardContent className="p-6 text-center">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary mb-1">
                  {classroom?.studentCount || 0}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Students enrolled
                </p>
                <Button
                  onClick={() =>
                    router.push(`/teacher/classrooms/${classroomId}/list`)
                  }
                  size="sm"
                >
                  Manage Students
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border">
                <CardContent className="p-4 text-center">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">
                    {classroom?.studentCount || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="p-4 text-center">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                    <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-2xl font-bold">{totalSessions}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="p-4 text-center">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold">{avgAttendance}%</p>
                  <p className="text-xs text-muted-foreground">
                    Avg. Attendance
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Danger Zone */}
            {user && classroom.teachers && classroom.teachers.length > 0 && (
              <Card className="border-2 border-destructive/50 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-destructive mb-2">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Deleting this classroom will permanently remove all
                    associated data including sessions, attendance records, and
                    student enrollments. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Classroom
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
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

      {/* Regenerate Code Dialog */}
      <Dialog open={regenerateCodeOpen} onOpenChange={setRegenerateCodeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Class Code</DialogTitle>
            <DialogDescription>
              This will generate a new code for this classroom. The old code
              will no longer work.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegenerateCodeOpen(false)}
              disabled={isRegenerating}
            >
              Cancel
            </Button>
            <Button onClick={handleRegenerateCode} disabled={isRegenerating}>
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Co-Teachers Dialog */}
      <Dialog
        open={manageCoTeachersOpen}
        onOpenChange={setManageCoTeachersOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Co-Teachers</DialogTitle>
            <DialogDescription>
              Add or remove co-teachers for this classroom.
            </DialogDescription>
          </DialogHeader>

          {/* Add Co-Teacher Section */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter teacher email"
                  value={coTeacherEmail}
                  onChange={(e) => setCoTeacherEmail(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCoTeacher()
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleAddCoTeacher}
                disabled={isAddingCoTeacher || !coTeacherEmail}
              >
                {isAddingCoTeacher ? 'Adding...' : 'Add'}
              </Button>
            </div>

            {/* Current Co-Teachers List */}
            {classroom &&
              classroom.teachers &&
              classroom.teachers.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Teachers ({classroom.teachers.length})</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {classroom.teachers.map((teacher, index) => {
                      const isObject = typeof teacher === 'object'
                      if (!isObject) return null

                      const isCreator = index === 0
                      const teacherId = teacher._id || teacher.id

                      return (
                        <div
                          key={teacherId}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={teacher.profileImage} />
                              <AvatarFallback>
                                {teacher.firstName?.[0]}
                                {teacher.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {teacher.firstName} {teacher.lastName}
                                {isCreator && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs"
                                  >
                                    Creator
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {teacher.email}
                              </p>
                            </div>
                          </div>
                          {!isCreator && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                teacherId && handleRemoveCoTeacher(teacherId)
                              }
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setManageCoTeachersOpen(false)
                setCoTeacherEmail('')
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Classroom Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setDeleteConfirmText('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete Classroom
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              classroom <strong>{classroom?.name}</strong> and remove all
              associated data including sessions, attendance records, and
              student enrollments.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              To confirm, type <strong>{classroom?.name}</strong> in the box
              below:
            </p>
            <Input
              placeholder="Type classroom name to confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteConfirmText('')
              }}
              disabled={isDeletingClass}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClassroom}
              disabled={
                isDeletingClass || deleteConfirmText !== classroom?.name
              }
            >
              {isDeletingClass ? 'Deleting...' : 'Delete Classroom'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
