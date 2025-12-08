'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BookOpen, LogIn, Sparkles, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { studentAPI, type Classroom } from '@/lib/api'
import { useMyClassrooms, revalidateClassroomLists } from '@/lib/hooks/use-api'
import { ClassroomCardSkeletonGrid } from '@/components/skeletons/classroom-card-skeleton'

interface UserData {
  _id?: string
  id?: string
  firstName: string
  lastName: string
  email: string
  role: 'TEACHER' | 'STUDENT'
  profileImage?: string
}

export default function StudentClassroomsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [joinClassOpen, setJoinClassOpen] = useState(false)
  const [isJoiningClass, setIsJoiningClass] = useState(false)
  const [classCode, setClassCode] = useState('')

  // Use SWR for data fetching with caching
  const {
    classrooms,
    isLoading,
    mutate: mutateClassrooms,
  } = useMyClassrooms('student')

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
  }, [router])

  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      toast.error('Validation error', {
        description: 'Please enter a class code',
      })
      return
    }

    setIsJoiningClass(true)
    try {
      const response = await studentAPI.joinClass(classCode.toUpperCase())
      if (response.success && response.data) {
        // Optimistically update the cache
        mutateClassrooms(
          (current) =>
            current
              ? [response.data!.classroom, ...current]
              : [response.data!.classroom],
          false
        )
        toast.success('Joined class!', {
          description: response.message,
        })
        setJoinClassOpen(false)
        setClassCode('')
        // Revalidate to ensure data is fresh
        mutateClassrooms()
      }
    } catch (error: any) {
      console.error('Error joining class:', error)
      toast.error('Failed to join class', {
        description: error.response?.data?.message || 'Please try again.',
      })
      // Revert optimistic update on error
      mutateClassrooms()
    } finally {
      setIsJoiningClass(false)
    }
  }

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [classroomToLeave, setClassroomToLeave] = useState<Classroom | null>(
    null
  )
  const [isLeavingClass, setIsLeavingClass] = useState(false)

  const handleLeaveClick = (classroom: Classroom, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setClassroomToLeave(classroom)
    setLeaveDialogOpen(true)
  }

  const handleLeaveClass = async () => {
    if (!classroomToLeave) return

    setIsLeavingClass(true)
    try {
      const response = await studentAPI.leaveClassroom(classroomToLeave.id)
      if (response.success) {
        // Optimistically update the cache
        mutateClassrooms(
          (current) =>
            current ? current.filter((c) => c.id !== classroomToLeave.id) : [],
          false
        )
        toast.success('Left classroom', {
          description: response.message,
        })
        setLeaveDialogOpen(false)
        setClassroomToLeave(null)
        // Revalidate to ensure data is fresh
        mutateClassrooms()
      }
    } catch (error: any) {
      console.error('Error leaving class:', error)
      toast.error('Failed to leave classroom', {
        description: error.response?.data?.message || 'Please try again.',
      })
      // Revert optimistic update on error
      mutateClassrooms()
    } finally {
      setIsLeavingClass(false)
    }
  }

  const handleClassClick = (classroomId: string) => {
    router.push(`/student/classrooms/${classroomId}`)
  }

  if (isLoading || !classrooms) {
    return (
      <div className="min-h-screen w-full bg-background pb-24">
        {/* Header */}
        <div className="relative bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 pt-10 pb-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
          <div className="container max-w-6xl mx-auto px-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-7 w-7 text-primary" />
                  <h1 className="text-3xl font-bold tracking-tight">
                    My Classes
                  </h1>
                </div>
                <p className="text-muted-foreground">
                  Manage your enrolled classes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content with Skeleton */}
        <div className="container max-w-6xl mx-auto px-4 -mt-6 relative z-10">
          <ClassroomCardSkeletonGrid count={6} />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-background pb-24 animate-fade-in">
      {/* Header */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 pt-10 pb-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-6xl mx-auto px-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-7 w-7 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">
                  My Classes
                </h1>
              </div>
              <p className="text-muted-foreground">
                Manage your enrolled classes
              </p>
            </div>
            <Button
              onClick={() => setJoinClassOpen(true)}
              size="lg"
              className="gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <LogIn className="h-5 w-5" />
              <span className="hidden sm:inline">Join Class</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 -mt-6 relative z-10">
        {classrooms.length === 0 ? (
          <Card className="border-2 shadow-xl">
            <CardContent className="text-center py-16">
              <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No classes yet</h3>
              <p className="text-muted-foreground mb-6">
                Join your first class to get started
              </p>
              <Button
                onClick={() => setJoinClassOpen(true)}
                size="lg"
                className="gap-2"
              >
                <LogIn className="h-5 w-5" />
                Join Your First Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.map((classroom) => (
              <Card
                key={classroom.id}
                className="border-2 hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => handleClassClick(classroom.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    {/* Creator Avatar */}
                    {classroom.teachers && classroom.teachers.length > 0 && (
                      <Avatar className="h-12 w-12 border-2 border-primary/20 flex-shrink-0">
                        <AvatarImage
                          src={
                            typeof classroom.teachers[0] === 'object'
                              ? classroom.teachers[0].profileImage
                              : undefined
                          }
                          alt="Teacher"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {typeof classroom.teachers[0] === 'object'
                            ? `${classroom.teachers[0].firstName[0]}${classroom.teachers[0].lastName[0]}`
                            : '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1 justify-center min-w-0">
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1 mb-1">
                        {classroom.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {classroom.subject}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleLeaveClick(classroom, e)}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Join Class Dialog */}
      <Dialog open={joinClassOpen} onOpenChange={setJoinClassOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join a Class</DialogTitle>
            <DialogDescription>
              Enter the class code provided by your teacher
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="class-code">Class Code</Label>
              <Input
                id="class-code"
                placeholder="ABC123"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="font-mono text-center text-lg tracking-wider uppercase"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setJoinClassOpen(false)
                setClassCode('')
              }}
              disabled={isJoiningClass}
            >
              Cancel
            </Button>
            <Button onClick={handleJoinClass} disabled={isJoiningClass}>
              {isJoiningClass ? 'Joining...' : 'Join Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Class Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Classroom</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave{' '}
              <span className="font-semibold">{classroomToLeave?.name}</span>?
              You can rejoin later using the class code.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLeaveDialogOpen(false)
                setClassroomToLeave(null)
              }}
              disabled={isLeavingClass}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveClass}
              disabled={isLeavingClass}
            >
              {isLeavingClass ? 'Leaving...' : 'Leave Classroom'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
