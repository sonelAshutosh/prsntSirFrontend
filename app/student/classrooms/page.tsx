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
import { BookOpen, LogIn, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { studentAPI, type Classroom } from '@/lib/api'

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
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [joinClassOpen, setJoinClassOpen] = useState(false)
  const [isJoiningClass, setIsJoiningClass] = useState(false)
  const [classCode, setClassCode] = useState('')

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
        fetchStudentClasses()
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  const fetchStudentClasses = async () => {
    try {
      const response = await studentAPI.getMyClasses()
      if (response.success && response.data) {
        setClassrooms(response.data.classrooms)
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error)
      toast.error('Failed to load classes', {
        description: error.response?.data?.message || 'Please try again later.',
      })
    } finally {
      setIsLoading(false)
    }
  }

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
        setClassrooms((prev) => [response.data!.classroom, ...prev])
        toast.success('Joined class!', {
          description: response.message,
        })
        setJoinClassOpen(false)
        setClassCode('')
      }
    } catch (error: any) {
      console.error('Error joining class:', error)
      toast.error('Failed to join class', {
        description: error.response?.data?.message || 'Please try again.',
      })
    } finally {
      setIsJoiningClass(false)
    }
  }

  const handleClassClick = (classroomId: string) => {
    router.push(`/student/classrooms/${classroomId}`)
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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-background pb-24">
      {/* Header */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 pt-6 pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-6xl mx-auto px-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
              <p className="text-muted-foreground text-sm">
                Manage your enrolled classes
              </p>
            </div>
            <Button
              onClick={() => setJoinClassOpen(true)}
              size="sm"
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              Join Class
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 -mt-4 relative z-10">
        {classrooms.length === 0 ? (
          <Card className="border-2 shadow-xl">
            <CardContent className="text-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No classes yet</h3>
              <p className="text-muted-foreground mb-6">
                Join your first class to get started
              </p>
              <Button onClick={() => setJoinClassOpen(true)} className="gap-2">
                <LogIn className="h-4 w-4" />
                Join Your First Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.map((classroom) => (
              <Card
                key={classroom.id}
                className="border-2 hover:shadow-lg transition-all cursor-pointer hover:border-primary/50 group"
                onClick={() => handleClassClick(classroom.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
                        {classroom.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {classroom.subject}
                      </p>
                    </div>
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
                className="font-mono text-center text-lg tracking-wider"
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
    </div>
  )
}
