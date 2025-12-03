'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QrCode, RefreshCw, Download, Sparkles } from 'lucide-react'
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
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
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
        toast.success('QR code regenerated!')
      }
    } catch (error: any) {
      console.error('Error regenerating QR code:', error)
      toast.error('Failed to regenerate QR code')
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

    toast.success('QR code downloaded!')
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
        <div className="container max-w-4xl mx-auto px-4 relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome, {user.firstName}!
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Your Attendance QR Code
          </p>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="container max-w-2xl mx-auto px-4 -mt-8 relative z-10">
        <Card className="border-2 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardContent className="p-8 md:p-12">
            {studentProfile?.qrCode ? (
              <div className="flex flex-col items-center gap-8">
                {/* QR Code Display */}
                <div className="relative">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
                  <div className="relative bg-white p-8 rounded-3xl shadow-2xl border-4 border-primary/10">
                    <Image
                      src={studentProfile.qrCode}
                      alt="Student QR Code"
                      width={280}
                      height={280}
                      className="rounded-2xl"
                      priority
                    />
                  </div>
                </div>

                {/* Student Info */}
                <div className="text-center space-y-3">
                  <div>
                    <p className="text-2xl font-bold mb-1">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="font-mono text-base px-4 py-1.5"
                  >
                    {studentProfile.studentId}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 border-2 hover:bg-accent/50 transition-all"
                    onClick={handleDownloadQR}
                  >
                    <Download className="h-4 w-4" />
                    Download QR
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 border-2 hover:bg-accent/50 transition-all"
                    onClick={handleRegenerateQR}
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>

                {/* Info Text */}
                <div className="bg-muted/50 rounded-2xl p-4 w-full">
                  <p className="text-sm text-center text-muted-foreground">
                    <strong className="text-foreground">Tip:</strong> Show this
                    QR code to your teacher during attendance sessions
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <QrCode className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-semibold mb-1">No QR Code Available</p>
                  <p className="text-sm text-muted-foreground">
                    Please refresh the page or contact support
                  </p>
                </div>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
