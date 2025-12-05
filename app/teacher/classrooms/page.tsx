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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  BookOpen,
  PlusCircle,
  RefreshCw,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { classroomAPI, type Classroom, type Teacher } from '@/lib/api'

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
  const [manageCoTeachersOpen, setManageCoTeachersOpen] = useState(false)
  const [coTeacherEmail, setCoTeacherEmail] = useState('')
  const [isAddingCoTeacher, setIsAddingCoTeacher] = useState(false)
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

  const handleManageCoTeachersClick = (
    e: React.MouseEvent,
    classroom: Classroom
  ) => {
    e.stopPropagation()
    setSelectedClassroom(classroom)
    setManageCoTeachersOpen(true)
  }

  const handleAddCoTeacher = async () => {
    if (!selectedClassroom || !coTeacherEmail) {
      toast.error('Validation error', {
        description: 'Please enter a teacher email',
      })
      return
    }

    setIsAddingCoTeacher(true)
    try {
      const response = await classroomAPI.addCoTeacher(
        selectedClassroom.id,
        coTeacherEmail
      )
      if (response.success && response.data) {
        setClassrooms((prev) =>
          prev.map((c) =>
            c.id === selectedClassroom.id ? response.data!.classroom : c
          )
        )
        setSelectedClassroom(response.data.classroom)
        toast.success('Co-teacher added!', {
          description: `${coTeacherEmail} has been added as a co-teacher`,
        })
        setCoTeacherEmail('')
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
    if (!selectedClassroom) return

    try {
      const response = await classroomAPI.removeCoTeacher(
        selectedClassroom.id,
        teacherId
      )
      if (response.success && response.data) {
        setClassrooms((prev) =>
          prev.map((c) =>
            c.id === selectedClassroom.id ? response.data!.classroom : c
          )
        )
        setSelectedClassroom(response.data.classroom)
        toast.success('Co-teacher removed!', {
          description: 'Co-teacher has been removed from the classroom',
        })
      }
    } catch (error: any) {
      console.error('Error removing co-teacher:', error)
      toast.error('Failed to remove co-teacher', {
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
                Manage your teaching classes
              </p>
            </div>
            <Button
              onClick={() => setCreateClassOpen(true)}
              size="lg"
              className="gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <PlusCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Create Class</span>
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
                Create your first class to get started
              </p>
              <Button
                onClick={() => setCreateClassOpen(true)}
                size="lg"
                className="gap-2"
              >
                <PlusCircle className="h-5 w-5" />
                Create Your First Class
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
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      {/* Creator Avatar */}
                      {classroom.teachers && classroom.teachers.length > 0 && (
                        <Avatar className="h-12 w-12 border-2 border-primary/20 flex-shrink-0">
                          <AvatarImage
                            src={
                              typeof classroom.teachers[0] === 'object'
                                ? classroom.teachers[0].profileImage
                                : undefined
                            }
                            alt="Creator"
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {typeof classroom.teachers[0] === 'object'
                              ? `${classroom.teachers[0].firstName[0]}${classroom.teachers[0].lastName[0]}`
                              : '?'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1 mb-1">
                          {classroom.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {classroom.subject}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <Badge
                        variant="secondary"
                        className="font-mono text-sm px-3 py-1"
                      >
                        {classroom.code}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-accent hover:text-primary transition-all"
                          onClick={(e) =>
                            handleManageCoTeachersClick(e, classroom)
                          }
                          title="Manage Co-Teachers"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-accent hover:text-primary transition-all"
                          onClick={(e) => handleRegenerateClick(e, classroom)}
                          title="Regenerate Code"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
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

      {/* Manage Co-Teachers Dialog */}
      <Dialog
        open={manageCoTeachersOpen}
        onOpenChange={(open) => {
          setManageCoTeachersOpen(open)
          if (!open) {
            setSelectedClassroom(null)
            setCoTeacherEmail('')
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Co-Teachers</DialogTitle>
            <DialogDescription>
              Add or remove co-teachers for{' '}
              <span className="font-semibold">{selectedClassroom?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Add Co-Teacher Section */}
            <div className="space-y-3">
              <Label htmlFor="coteacher-email">Add Co-Teacher</Label>
              <div className="flex gap-2">
                <Input
                  id="coteacher-email"
                  type="email"
                  placeholder="teacher@example.com"
                  value={coTeacherEmail}
                  onChange={(e) => setCoTeacherEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCoTeacher()
                    }
                  }}
                />
                <Button
                  onClick={handleAddCoTeacher}
                  disabled={isAddingCoTeacher || !coTeacherEmail}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {isAddingCoTeacher ? 'Adding...' : 'Add'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the email address of a registered teacher
              </p>
            </div>

            {/* Current Co-Teachers List */}
            <div className="space-y-3">
              <Label>
                Current Teachers (
                {Array.isArray(selectedClassroom?.teachers)
                  ? selectedClassroom.teachers.length
                  : 0}
                )
              </Label>
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {selectedClassroom?.teachers &&
                Array.isArray(selectedClassroom.teachers) &&
                selectedClassroom.teachers.length > 0 ? (
                  selectedClassroom.teachers.map((teacher, index) => {
                    // Handle both populated and non-populated teacher data
                    const isPopulated =
                      typeof teacher === 'object' && teacher !== null
                    const teacherId = isPopulated
                      ? (teacher as Teacher)._id || (teacher as Teacher).id
                      : teacher
                    const teacherName = isPopulated
                      ? `${(teacher as Teacher).firstName} ${
                          (teacher as Teacher).lastName
                        }`
                      : 'Loading...'
                    const teacherEmail = isPopulated
                      ? (teacher as Teacher).email
                      : ''

                    // First teacher (index 0) is the classroom creator
                    const isCreator = index === 0

                    return (
                      <div
                        key={teacherId}
                        className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{teacherName}</p>
                            {isCreator && (
                              <Badge variant="secondary" className="text-xs">
                                Creator
                              </Badge>
                            )}
                          </div>
                          {teacherEmail && (
                            <p className="text-sm text-muted-foreground">
                              {teacherEmail}
                            </p>
                          )}
                        </div>
                        {selectedClassroom.teachers.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              handleRemoveCoTeacher(teacherId as string)
                            }
                            disabled={isCreator}
                            title={
                              isCreator
                                ? 'Cannot remove classroom creator'
                                : 'Remove co-teacher'
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No teachers found
                  </div>
                )}
              </div>
              {selectedClassroom?.teachers &&
                selectedClassroom.teachers.length === 1 && (
                  <p className="text-xs text-muted-foreground">
                    At least one teacher is required for the classroom
                  </p>
                )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setManageCoTeachersOpen(false)
                setSelectedClassroom(null)
                setCoTeacherEmail('')
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
