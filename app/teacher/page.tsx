'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BookOpen, Users, Calendar } from 'lucide-react'

interface UserData {
  _id?: string
  id?: string
  firstName: string
  lastName: string
  email: string
  role: 'TEACHER' | 'STUDENT'
  profileImage?: string
}

export default function TeacherPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)

        // Redirect if not a teacher
        if (parsedUser.role !== 'TEACHER') {
          router.push('/student')
          return
        }

        setUser(parsedUser)
        setIsLoading(false)
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

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
      <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 pt-8 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-4xl mx-auto px-4 relative">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your classes and track attendance
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 -mt-8 relative z-10">
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Teacher Dashboard
            </CardTitle>
            <CardDescription>
              Quick overview of your teaching activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Total Classes */}
              <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        Total Classes
                      </p>
                      <p className="text-3xl font-bold text-primary">0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Students */}
              <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        Total Students
                      </p>
                      <p className="text-3xl font-bold text-primary">0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Sessions */}
              <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        Sessions This Week
                      </p>
                      <p className="text-3xl font-bold text-primary">0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Average Attendance */}
              <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        Avg. Attendance
                      </p>
                      <p className="text-3xl font-bold text-primary">0%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 p-6 bg-muted/50 rounded-lg text-center">
              <p className="text-muted-foreground">
                Go to{' '}
                <span className="font-semibold text-foreground">Classes</span>{' '}
                to create and manage your classrooms
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
