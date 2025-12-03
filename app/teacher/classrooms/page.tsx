'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { BookOpen, PlusCircle, ChevronRight, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { classroomAPI, type Classroom } from '@/lib/api'

interface UserData {
  _id?: string
  id?: string
  firstName: string
  lastName: string
  email: string
  role: 'TEACHER' | 'STUDENT'
  profileImage?: string
}

export default function TeacherClassroomsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createClassOpen, setCreateClassOpen] = useState(false)
  const [isCreatingClass, setIsCreatingClass] = useState(false)
  const [regenerateCodeOpen, setRegenerateCodeOpen] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(
    null
  )
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [createClassData, setCreateClassData] = useState({
    name: '',
    subject: '',
  })

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
        fetchTeacherClassrooms()
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  const fetchTeacherClassrooms = async () => {
    try {
      const response = await classroomAPI.getMyClasses()
      if (response.success && response.data) {
        setClassrooms(response.data.classrooms)
      }
    } catch (error: any) {
      console.error('Error fetching classrooms:', error)
      toast.error('Failed to load classes', {
        description: error.response?.data?.message || 'Please try again later.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateClass = async () => {
    if (!createClassData.name || !createClassData.subject) {
      toast.error('Validation error', {
        description: 'Please fill in all fields',
      })
      return
    }

    setIsCreatingClass(true)
    try {
      const response = await classroomAPI.create(createClassData)
      if (response.success && response.data) {
        setClassrooms((prev) => [response.data!.classroom, ...prev])
        toast.success('Class created!', {
          description: `${response.data.classroom.name} - Code: ${response.data.classroom.code}`,
        })
        setCreateClassOpen(false)
        setCreateClassData({ name: '', subject: '' })
      }
    } catch (error: any) {
      console.error('Error creating classroom:', error)
      toast.error('Failed to create class', {
        description: error.response?.data?.message || 'Please try again.',
      })
    } finally {
      setIsCreatingClass(false)
    }
  }

  const handleRegenerateCode = async () => {
    if (!selectedClassroom) return

    setIsRegenerating(true)
    try {
      const response = await classroomAPI.regenerateCode(selectedClassroom.id)
      if (response.success && response.data) {
        setClassrooms((prev) =>
          prev.map((c) =>
            c.id === selectedClassroom.id ? response.data!.classroom : c
          )
        )
        toast.success('Code regenerated!', {
          description: `New code: ${response.data.classroom.code}`,
        })
        setRegenerateCodeOpen(false)
        setSelectedClassroom(null)
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

  const handleClassClick = (classroomId: string) => {
    router.push(`/teacher/classrooms/${classroomId}`)
  }

  const handleRegenerateClick = (e: React.MouseEvent, classroom: Classroom) => {
    e.stopPropagation()
    setSelectedClassroom(classroom)
    setRegenerateCodeOpen(true)
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
                Manage your teaching classes
              </p>
            </div>
            <Button
              onClick={() => setCreateClassOpen(true)}
              size="sm"
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Class
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
                Create your first class to get started
              </p>
              <Button
                onClick={() => setCreateClassOpen(true)}
                className="gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Create Your First Class
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
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
                        {classroom.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {classroom.subject}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Badge
                        variant="secondary"
                        className="font-mono text-xs px-2 py-0.5"
                      >
                        {classroom.code}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mr-2 text-muted-foreground hover:text-primary"
                        onClick={(e) => handleRegenerateClick(e, classroom)}
                        title="Regenerate Code"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Dialog */}
      <Dialog open={createClassOpen} onOpenChange={setCreateClassOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>
              Create a new classroom for your students
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="class-name">Class Name</Label>
              <Input
                id="class-name"
                placeholder="Computer Science 101"
                value={createClassData.name}
                onChange={(e) =>
                  setCreateClassData({
                    ...createClassData,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="class-subject">Subject</Label>
              <Input
                id="class-subject"
                placeholder="Computer Science"
                value={createClassData.subject}
                onChange={(e) =>
                  setCreateClassData({
                    ...createClassData,
                    subject: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateClassOpen(false)
                setCreateClassData({ name: '', subject: '' })
              }}
              disabled={isCreatingClass}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateClass} disabled={isCreatingClass}>
              {isCreatingClass ? 'Creating...' : 'Create Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Code Dialog */}
      <Dialog open={regenerateCodeOpen} onOpenChange={setRegenerateCodeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Class Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to generate a new code for{' '}
              <span className="font-semibold">{selectedClassroom?.name}</span>?
              The old code will no longer work.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Current code:{' '}
              <Badge variant="secondary" className="font-mono">
                {selectedClassroom?.code}
              </Badge>
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRegenerateCodeOpen(false)
                setSelectedClassroom(null)
              }}
              disabled={isRegenerating}
            >
              Cancel
            </Button>
            <Button onClick={handleRegenerateCode} disabled={isRegenerating}>
              {isRegenerating ? 'Regenerating...' : 'Regenerate Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
