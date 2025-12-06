'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Mail, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { classroomAPI, type Classroom as ClassroomType } from '@/lib/api'
import { Separator } from '@/components/ui/separator'

interface Student {
  userId: {
    _id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
  }
  studentId: string
  enrollmentStatus?: 'ACTIVE' | 'LEFT'
  joinedAt: string
  leftAt?: string | null
}

interface Classroom {
  id: string
  name: string
  subject: string
  code: string
}

export default function StudentListPage() {
  const router = useRouter()
  const params = useParams()
  const classroomId = params.id as string

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'active' | 'left' | 'all'>(
    'active'
  )

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== 'TEACHER') {
        router.push('/student/classrooms')
        return
      }
      fetchClassroomAndStudents()
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/login')
    }
  }, [classroomId, router])

  useEffect(() => {
    if (classroom) {
      fetchStudents()
    }
  }, [statusFilter])

  const fetchStudents = async () => {
    try {
      const studentsResponse = await classroomAPI.getStudents(
        classroomId,
        statusFilter
      )
      if (studentsResponse.success && studentsResponse.data) {
        setStudents(studentsResponse.data.students)
      }
    } catch (error: any) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
    }
  }

  const fetchClassroomAndStudents = async () => {
    try {
      // Fetch classroom details
      const classroomResponse = await classroomAPI.getMyClasses()
      if (classroomResponse.success && classroomResponse.data) {
        const foundClassroom = classroomResponse.data.classrooms.find(
          (c) => c.id === classroomId
        )
        if (foundClassroom) {
          setClassroom(foundClassroom)
        } else {
          toast.error('Classroom not found')
          router.push('/teacher/classrooms')
          return
        }
      }

      // Fetch students enrolled in this classroom
      await fetchStudents()
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load student list')
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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

  if (!classroom) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-background pb-24">
      {/* Header */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 pt-8 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-6xl mx-auto px-4 relative">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 gap-2"
            onClick={() => router.push('/teacher/classrooms')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Classes
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Student List</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <p className="text-lg font-semibold">{classroom.name}</p>
            <Badge variant="secondary" className="w-fit">
              {classroom.subject}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 -mt-12 relative z-10">
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span>Enrolled Students ({students.length})</span>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'left' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('left')}
                >
                  Left
                </Button>
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No students yet</h3>
                <p className="text-muted-foreground">
                  Students will appear here once they join using the class code
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {students.map((student, index) => (
                  <div key={student.studentId}>
                    {/* Row */}
                    <div className="flex items-center gap-4 py-3">
                      {/* Avatar */}
                      <Avatar className="h-12 w-12 border-2 border-background">
                        <AvatarImage
                          src={student.userId.profileImage || undefined}
                          alt={`${student.userId.firstName} ${student.userId.lastName}`}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(
                            student.userId.firstName,
                            student.userId.lastName
                          )}
                        </AvatarFallback>
                      </Avatar>

                      {/* Student Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {student.userId.firstName} {student.userId.lastName}
                          </h3>
                          {student.enrollmentStatus === 'LEFT' && (
                            <Badge variant="destructive" className="text-xs">
                              Left
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">
                            {student.userId.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Joined: {formatDate(student.joinedAt)}
                            {student.leftAt &&
                              ` • Left: ${formatDate(student.leftAt)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Separator (except after last item) */}
                    {index < students.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
