'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QrCode, RefreshCw, Download } from 'lucide-react'
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
    <div className="min-h-screen w-full bg-background pb-24">
      {/* Header */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 pt-8 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-4xl mx-auto px-4 relative">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">Your Attendance QR Code</p>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="container max-w-4xl mx-auto px-4 -mt-6 relative z-10">
        <Card className="border-2 shadow-xl">
          <CardContent className="p-8">
            {studentProfile?.qrCode ? (
              <div className="flex flex-col items-center gap-6">
                {/* QR Code Display */}
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

                {/* Student Info */}
                <div className="text-center space-y-1">
                  <p className="text-lg font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <Badge variant="secondary" className="font-mono">
                    {studentProfile.studentId}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleDownloadQR}
                  >
                    <Download className="h-4 w-4" />
                    Download
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
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <QrCode className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No QR code available. Please refresh the page.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
