'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit,
  LogOut,
  BookOpen,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'

interface UserData {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: 'TEACHER' | 'STUDENT'
  profileImage?: string
  createdAt: string
  updatedAt: string
}

function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        toast.error('Failed to load profile', {
          description: 'Please try logging in again.',
        })
        router.push('/login')
      }
    } else {
      toast.error('Not authenticated', {
        description: 'Please log in to view your profile.',
      })
      router.push('/login')
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Clear cookie
      const { deleteCookie } = await import('@/lib/cookies')
      deleteCookie('token')

      toast.success('Logged out successfully', {
        description: 'See you next time!',
      })

      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed', {
        description: 'Please try again.',
      })
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-background pb-24">
      {/* Header Section with Gradient */}
      <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 pt-8 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-4xl mx-auto px-4 relative">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                My Profile
              </h1>
              <p className="text-muted-foreground">
                Manage your account information
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 -mt-24 relative z-10">
        {/* Profile Card */}
        <Card className="mb-6 overflow-hidden border-2 shadow-xl">
          <CardContent className="p-0">
            {/* Profile Header */}
            <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-8 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar */}
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-2xl ring-4 ring-primary/20">
                    <AvatarImage
                      src={user.profileImage || undefined}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                    <AvatarFallback className="text-3xl font-semibold bg-primary text-primary-foreground">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <h2 className="text-3xl font-bold tracking-tight">
                      {user.firstName} {user.lastName}
                    </h2>
                    <Badge
                      variant={
                        user.role === 'TEACHER' ? 'default' : 'secondary'
                      }
                      className="w-fit mx-auto sm:mx-0"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mb-4">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <Button className="gap-2 shadow-md">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Profile Details */}
            <div className="p-8">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Account Information
              </h3>

              <div className="grid gap-6">
                {/* Personal Information */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      First Name
                    </label>
                    <p className="text-base font-medium pl-6">
                      {user.firstName}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Last Name
                    </label>
                    <p className="text-base font-medium pl-6">
                      {user.lastName}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </label>
                  <p className="text-base font-medium pl-6">{user.email}</p>
                </div>

                <Separator />

                {/* Account Details */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Member Since
                    </label>
                    <p className="text-base font-medium pl-6">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Last Updated
                    </label>
                    <p className="text-base font-medium pl-6">
                      {formatDate(user.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Quick Stats Card */}
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Quick Stats
              </CardTitle>
              <CardDescription>Your activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {user.role === 'TEACHER'
                      ? 'Classes Created'
                      : 'Classes Joined'}
                  </span>
                  <span className="text-2xl font-bold text-primary">0</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {user.role === 'TEACHER'
                      ? 'Total Students'
                      : 'Attendance Rate'}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {user.role === 'TEACHER' ? '0' : '0%'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Account Settings
              </CardTitle>
              <CardDescription>Manage your preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Edit className="h-4 w-4" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <User className="h-4 w-4" />
                Update Profile Picture
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
