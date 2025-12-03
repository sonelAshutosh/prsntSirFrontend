'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Users, Calendar, TrendingUp } from 'lucide-react'
import { classroomAPI, attendanceAPI } from '@/lib/api'
import { toast } from 'sonner'

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

interface Session {
  id: string
  date: string
  type: 'MANUAL' | 'QR'
  status: 'completed' | 'active'
  totalStudents: number
  presentStudents: number
  topic: string
}

export default function TeacherPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalSessions: 0,
    avgAttendance: 0,
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        if (parsedUser.role !== 'TEACHER') {
          router.push('/student')
          return
        }
        setUser(parsedUser)
        fetchTeacherStats()
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  const fetchTeacherStats = async () => {
    try {
      // Fetch all classrooms
      const classroomsResponse = await classroomAPI.getMyClasses()

      if (classroomsResponse.success && classroomsResponse.data) {
        const classrooms: Classroom[] = classroomsResponse.data.classrooms
        const totalClasses = classrooms.length

        // Calculate total students across all classrooms
        const totalStudents = classrooms.reduce(
          (sum, classroom) => sum + (classroom.studentCount || 0),
          0
        )

        // Fetch sessions for all classrooms and calculate stats
        let allSessions: Session[] = []

        for (const classroom of classrooms) {
          try {
            const sessionsResponse = await attendanceAPI.getClassroomSessions(
              classroom.id
            )
            if (sessionsResponse.success && sessionsResponse.data) {
              allSessions = [...allSessions, ...sessionsResponse.data.sessions]
            }
          } catch (error) {
            console.error(
              `Error fetching sessions for classroom ${classroom.id}:`,
              error
            )
          }
        }

        const totalSessions = allSessions.length

        // Calculate average attendance across all sessions
        const avgAttendance =
          totalSessions > 0
            ? Math.round(
                allSessions.reduce(
                  (acc, session) =>
                    acc +
                    (session.totalStudents > 0
                      ? (session.presentStudents / session.totalStudents) * 100
                      : 0),
                  0
                ) / totalSessions
              )
            : 0

        setStats({
          totalClasses,
          totalStudents,
          totalSessions,
          avgAttendance,
        })
      }
    } catch (error: any) {
      console.error('Error fetching teacher stats:', error)
      toast.error('Failed to load statistics', {
        description: error.response?.data?.message || 'Please try again later.',
      })
    } finally {
      setIsLoading(false)
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
      <div className="relative bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 pt-12 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-5xl mx-auto px-4 relative">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-lg text-muted-foreground">Teacher Dashboard</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="container max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Classes
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.totalClasses}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Students
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.totalStudents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-green-500/20 to-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Sessions
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.totalSessions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-orange-500/20 to-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Attendance
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.avgAttendance}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
