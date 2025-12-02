'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { QrCode, RefreshCw, TrendingUp, Download } from 'lucide-react'
import { toast } from 'sonner'
import { studentAPI, type StudentProfile } from '@/lib/api'

interface UserData {
  _id?: string
  id?: string
  firstName: string
  lastName: string
  email: string
  role: 'TEACHER' | 'STUDENT'
  profileImage?: string
}

export default function StudentPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)

        // Redirect if not a student
        if (parsedUser.role !== 'STUDENT') {
          router.push('/teacher')
          return
        }

        setUser(parsedUser)
        fetchStudentProfile()
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  const fetchStudentProfile = async () => {
    try {
      const response = await studentAPI.getProfile()
      if (response.success && response.data) {
        setStudentProfile(response.data.studentProfile)
      }
    } catch (error: any) {
      console.error('Error fetching student profile:', error)
      toast.error('Failed to load QR code', {
        description: error.response?.data?.message || 'Please try again later.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateQR = async () => {
    setIsRegenerating(true)
    try {
      const response = await studentAPI.regenerateQR()
      if (response.success && response.data) {
        setStudentProfile((prev) =>
          prev ? { ...prev, qrCode: response.data!.qrCode } : null
        )
        toast.success('QR code regenerated!', {
          description: 'Your new QR code is ready.',
        })
      }
    } catch (error: any) {
      console.error('Error regenerating QR code:', error)
      toast.error('Failed to regenerate QR code', {
        description: error.response?.data?.message || 'Please try again.',
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleDownloadQR = () => {
    if (!studentProfile?.qrCode) return

    const link = document.createElement('a')
    link.href = studentProfile.qrCode
    link.download = `${user?.firstName}_${user?.lastName}_QR.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('QR code downloaded!', {
      description: 'Your QR code has been saved.',
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
          <p className="text-muted-foreground">Your attendance QR code</p>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 -mt-8 relative z-10 space-y-6">
        {/* QR Code Card */}
        <Card className="border-2 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Your QR Code
                </CardTitle>
                <CardDescription>
                  Scan this code to mark your attendance
                </CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {studentProfile?.qrCode ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative bg-white p-6 rounded-2xl shadow-lg border-4 border-primary/20">
                  <Image
                    src={studentProfile.qrCode}
                    alt="Student QR Code"
                    width={300}
                    height={300}
                    className="rounded-lg"
                    priority
                  />
                </div>

                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Student ID: {studentProfile.studentId}
                  </p>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleDownloadQR}
                  >
                    <Download className="h-4 w-4" />
                    Download QR
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleRegenerateQR}
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Regenerate QR
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-center max-w-md">
                  <p>
                    Present this QR code to your teacher to mark your attendance
                    in class. Keep it safe and don&apos;t share it with others.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <QrCode className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No QR code available. Please try refreshing the page.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Overall Rate
              </span>
              <span className="text-3xl font-bold text-primary">0%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
