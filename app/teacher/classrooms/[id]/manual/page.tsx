'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Check, X, Users, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { attendanceAPI, classroomAPI, type AttendanceStudent } from '@/lib/api'

interface UserData {
  _id?: string
  id?: string
  firstName: string
  lastName: string
  email: string
  role: 'TEACHER' | 'STUDENT'
}

export default function ManualAttendancePage() {
  const router = useRouter()
  const params = useParams()
  const classroomId = params.id as string
  const searchParams = useSearchParams()
  const querySessionId = searchParams.get('sessionId')

  const [user, setUser] = useState<UserData | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionTopic, setSessionTopic] = useState<string>('')
  const [students, setStudents] = useState<AttendanceStudent[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarking, setIsMarking] = useState(false)
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    remaining: 0,
  })

  // Swipe animation state
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(
    null
  )
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        if (parsedUser.role !== 'TEACHER') {
          router.push('/student/classrooms')
          return
        }
        setUser(parsedUser)
        initializeSession()
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router, classroomId])

  const initializeSession = async () => {
    try {
      let newSessionId = querySessionId

      if (!newSessionId) {
        // Create attendance session if not provided
        const sessionResponse = await attendanceAPI.createSession({
          classroomId,
          mode: 'MANUAL',
        })

        if (sessionResponse.success && sessionResponse.data) {
          newSessionId = sessionResponse.data.session.id
          setSessionTopic(sessionResponse.data.session.topic || '')
        }
      }

      if (newSessionId) {
        setSessionId(newSessionId)

        // Get students for this session
        const studentsResponse = await attendanceAPI.getSessionStudents(
          newSessionId
        )

        if (studentsResponse.success && studentsResponse.data) {
          setStudents(studentsResponse.data.students)
          if (studentsResponse.data.session) {
            setSessionTopic(studentsResponse.data.session.topic || '')
          }
          setStats({
            present: 0,
            absent: 0,
            remaining: studentsResponse.data.students.length,
          })
        }
      }
    } catch (error: any) {
      console.error('Error initializing session:', error)
      toast.error('Failed to start attendance session')
      router.push(`/teacher/classrooms/${classroomId}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Touch and Mouse event handlers for swipe
  const handleDragStart = (clientX: number, clientY: number) => {
    if (isMarking || currentIndex >= students.length) return
    setIsDragging(true)
    startPosRef.current = { x: clientX, y: clientY }
  }

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return
    const deltaX = clientX - startPosRef.current.x
    setDragOffset(deltaX)
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const threshold = 100 // pixels to trigger swipe
    if (Math.abs(dragOffset) > threshold) {
      const direction = dragOffset > 0 ? 'right' : 'left'
      handleSwipe(direction)
    }
    setDragOffset(0)
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    handleDragEnd()
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd()
    }
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleDragStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleDragMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (isMarking || currentIndex >= students.length) return

    const currentStudent = students[currentIndex]
    const status = direction === 'right' ? 'PRESENT' : 'ABSENT'

    setSwipeDirection(direction)
    setIsMarking(true)

    try {
      await attendanceAPI.markAttendance(sessionId!, currentStudent.id, status)

      // Update stats
      setStats((prev) => ({
        present: status === 'PRESENT' ? prev.present + 1 : prev.present,
        absent: status === 'ABSENT' ? prev.absent + 1 : prev.absent,
        remaining: prev.remaining - 1,
      }))

      // Wait for animation
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        setSwipeDirection(null)
        setIsMarking(false)
      }, 300)
    } catch (error: any) {
      console.error('Error marking attendance:', error)
      toast.error('Failed to mark attendance')
      setSwipeDirection(null)
      setIsMarking(false)
    }
  }

  const handleEndSession = async () => {
    if (!sessionId) return

    try {
      await attendanceAPI.endSession(sessionId)
      toast.success('Attendance session completed!', {
        description: `${stats.present} present, ${stats.absent} absent`,
      })
      router.push(`/teacher/classrooms/${classroomId}`)
    } catch (error: any) {
      console.error('Error ending session:', error)
      toast.error('Failed to end session')
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Starting session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const currentStudent = students[currentIndex]
  const isComplete = currentIndex >= students.length

  return (
    <div className="min-h-screen w-full bg-background pb-24">
      {/* Header */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 pt-8 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-4xl mx-auto px-4 relative">
          <Button
            variant="ghost"
            className="mb-4 gap-2"
            onClick={() => router.push(`/teacher/classrooms/${classroomId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Manual Attendance
          </h1>
          {sessionTopic && (
            <p className="text-muted-foreground mb-4">{sessionTopic}</p>
          )}

          {/* Stats */}
          <div className="flex gap-4">
            <Badge variant="secondary" className="gap-2">
              <Users className="h-4 w-4" />
              {stats.remaining} remaining
            </Badge>
            <Badge className="gap-2 bg-green-500">
              <CheckCircle2 className="h-4 w-4" />
              {stats.present} present
            </Badge>
            <Badge variant="destructive" className="gap-2">
              <XCircle className="h-4 w-4" />
              {stats.absent} absent
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 -mt-6 relative z-10">
        {isComplete ? (
          <Card className="border-2 shadow-xl">
            <CardContent className="text-center py-16">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">All Done!</h2>
              <p className="text-muted-foreground mb-6">
                You've marked attendance for all students
              </p>
              <div className="flex gap-4 justify-center mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">
                    {stats.present}
                  </p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-destructive">
                    {stats.absent}
                  </p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
              </div>
              <Button onClick={handleEndSession} size="lg">
                Complete Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Swipe Card */}
            <div className="relative h-[500px] mb-8">
              <Card
                ref={cardRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  transform: isDragging
                    ? `translateX(${dragOffset}px) rotate(${
                        dragOffset / 20
                      }deg)`
                    : swipeDirection === 'right'
                    ? 'translateX(200%) rotate(12deg)'
                    : swipeDirection === 'left'
                    ? 'translateX(-200%) rotate(-12deg)'
                    : 'translateX(0) rotate(0)',
                  opacity: swipeDirection ? 0 : 1,
                }}
                className={`absolute inset-0 border-4 shadow-2xl transition-all cursor-grab active:cursor-grabbing select-none ${
                  isDragging
                    ? dragOffset > 50
                      ? 'border-green-500'
                      : dragOffset < -50
                      ? 'border-red-500'
                      : 'border-primary'
                    : 'border-primary'
                } ${
                  !isDragging && !swipeDirection ? 'duration-300' : 'duration-0'
                }`}
              >
                <CardContent className="p-8 h-full flex flex-col items-center justify-center pointer-events-none">
                  {/* Drag Indicators */}
                  {isDragging && (
                    <>
                      {dragOffset > 50 && (
                        <div className="absolute top-8 right-8 bg-green-500 text-white px-6 py-3 rounded-full font-bold text-xl rotate-12">
                          PRESENT
                        </div>
                      )}
                      {dragOffset < -50 && (
                        <div className="absolute top-8 left-8 bg-red-500 text-white px-6 py-3 rounded-full font-bold text-xl -rotate-12">
                          ABSENT
                        </div>
                      )}
                    </>
                  )}

                  {/* Avatar */}
                  <Avatar className="h-40 w-40 border-4 border-primary shadow-lg mb-6">
                    <AvatarImage
                      src={currentStudent?.profileImage || undefined}
                      alt={`${currentStudent?.firstName} ${currentStudent?.lastName}`}
                    />
                    <AvatarFallback className="text-4xl font-semibold bg-primary text-primary-foreground">
                      {currentStudent &&
                        getInitials(
                          currentStudent.firstName,
                          currentStudent.lastName
                        )}
                    </AvatarFallback>
                  </Avatar>

                  {/* Student Info */}
                  <h2 className="text-3xl font-bold mb-2">
                    {currentStudent?.firstName} {currentStudent?.lastName}
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    {currentStudent?.email}
                  </p>
                  <Badge variant="secondary" className="font-mono">
                    {currentStudent?.studentId}
                  </Badge>

                  {/* Swipe Instructions */}
                  <p className="text-sm text-muted-foreground mt-8">
                    {isDragging
                      ? 'Release to mark'
                      : 'Drag or swipe to mark attendance'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-8">
              <Button
                size="lg"
                variant="destructive"
                className="h-20 w-20 rounded-full"
                onClick={() => handleSwipe('left')}
                disabled={isMarking}
              >
                <X className="h-10 w-10" />
              </Button>
              <Button
                size="lg"
                className="h-20 w-20 rounded-full bg-green-500 hover:bg-green-600"
                onClick={() => handleSwipe('right')}
                disabled={isMarking}
              >
                <Check className="h-10 w-10" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
