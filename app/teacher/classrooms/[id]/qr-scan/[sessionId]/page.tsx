'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  XCircle,
  Users,
  Scan,
  Info,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { attendanceAPI } from '@/lib/api'
import { Scanner } from '@yudiel/react-qr-scanner'

interface ScannedStudent {
  id: string
  name: string
  studentId: string
  email: string
  scannedAt: string
  status: string
}

export default function QRScannerPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string
  const classroomId = params.id as string

  const [isScanning, setIsScanning] = useState(false)
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Cooldown tracking to prevent duplicate scans
  const scanCooldownRef = useRef<Map<string, number>>(new Map())
  const SCAN_COOLDOWN_MS = 500 // Reduced to 500ms for faster re-scanning

  // Fetch already marked students when page loads
  useEffect(() => {
    const fetchMarkedStudents = async () => {
      try {
        const response = await attendanceAPI.getMarkedStudents(sessionId)
        if (response.success && response.data.markedStudents) {
          setScannedStudents(response.data.markedStudents)
        }
      } catch (error) {
        console.error('Error fetching marked students:', error)
      }
    }

    fetchMarkedStudents()
  }, [sessionId])

  const startScanning = () => {
    setIsScanning(true)
    toast.success('Scanner started', {
      description: 'Point camera at student QR code',
    })
  }

  const stopScanning = () => {
    setIsScanning(false)
    toast.info('Scanner stopped')
  }

  const showSuccessOverlay = () => {
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(34, 197, 94, 0.95);
      color: white;
      padding: 32px 48px;
      border-radius: 16px;
      font-size: 24px;
      font-weight: bold;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
      animation: successPop 0.5s ease-out;
    `
    overlay.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>Attendance Marked!</span>
    `

    if (!document.getElementById('success-animation-styles')) {
      const style = document.createElement('style')
      style.id = 'success-animation-styles'
      style.textContent = `
        @keyframes successPop {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `
      document.head.appendChild(style)
    }

    document.body.appendChild(overlay)

    setTimeout(() => {
      overlay.style.opacity = '0'
      overlay.style.transition = 'opacity 0.3s ease-out'
      setTimeout(() => overlay.remove(), 300)
    }, 1500)
  }

  const onScanSuccess = async (decodedText: string) => {
    // Check cooldown to prevent duplicate scans
    const now = Date.now()
    const lastScanTime = scanCooldownRef.current.get(decodedText)

    if (lastScanTime && now - lastScanTime < SCAN_COOLDOWN_MS) {
      return
    }

    if (isProcessing) {
      return
    }

    // Add to cooldown immediately to prevent rapid re-scans
    scanCooldownRef.current.set(decodedText, now)

    setIsProcessing(true)

    try {
      const response = await attendanceAPI.scanQRCode(sessionId, decodedText)

      if (response.success && response.data) {
        const student: ScannedStudent = {
          ...response.data.student,
          scannedAt: new Date().toLocaleTimeString(),
          status: response.data.record.status,
        }

        setScannedStudents((prev) => [student, ...prev])
        showSuccessOverlay()

        toast.success('Attendance marked!', {
          description: `${student.name} - Present`,
          duration: 3000,
        })
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to mark attendance'

      // If error is "already marked", keep the cooldown
      // Otherwise, remove from cooldown to allow retry
      if (!errorMessage.toLowerCase().includes('already marked')) {
        scanCooldownRef.current.delete(decodedText)
      }

      toast.error('Scan failed', {
        description: errorMessage,
      })
    } finally {
      setTimeout(() => {
        setIsProcessing(false)

        // Clean up old cooldown entries (older than cooldown period)
        const cleanupTime = Date.now() - SCAN_COOLDOWN_MS
        for (const [qrCode, timestamp] of scanCooldownRef.current.entries()) {
          if (timestamp < cleanupTime) {
            scanCooldownRef.current.delete(qrCode)
          }
        }
      }, 100) // Reduced from 1000ms to 100ms for faster scanning
    }
  }

  const handleEndSession = async () => {
    try {
      await stopScanning()
      await attendanceAPI.endSession(sessionId)

      toast.success('Session ended successfully')
      router.push(`/teacher/classrooms/${classroomId}`)
    } catch (error: any) {
      console.error('Error ending session:', error)
      toast.error('Failed to end session')
    }
  }

  return (
    <div className="min-h-screen w-full bg-background pb-24 animate-fade-in">
      {/* Animations */}
      <style jsx global>{`
        @keyframes highlightFade {
          0% {
            background-color: rgba(34, 197, 94, 0.2);
          }
          100% {
            background-color: transparent;
          }
        }

        @keyframes bounce-once {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .animate-bounce-once {
          animation: bounce-once 0.5s ease-out;
        }
      `}</style>

      {/* Header */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 pt-10 pb-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-5xl mx-auto px-4 relative">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/teacher/classrooms/${classroomId}`)}
              className="hover:bg-background/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Scan className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">QR Scanner</h1>
            </div>
          </div>
          <p className="text-muted-foreground ml-14">
            Scan student QR codes to mark attendance
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-5xl mx-auto px-4 -mt-8 relative z-10 space-y-6">
        {/* Scanner Card */}
        <Card className="border-2 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Scanner Container */}
              <div className="relative">
                {isScanning ? (
                  <div className="w-full rounded-xl overflow-hidden">
                    <Scanner
                      onScan={(result) => {
                        if (result && result.length > 0) {
                          onScanSuccess(result[0].rawValue)
                        }
                      }}
                      onError={(error) => {
                        console.log('Scanner error:', error)
                      }}
                      constraints={{
                        facingMode: 'environment', // Use back camera
                      }}
                      scanDelay={100} // Very fast scanning - 100ms between scans
                      styles={{
                        container: {
                          width: '100%',
                          minHeight: '400px',
                        },
                      }}
                      components={{
                        finder: true, // Show scanning box
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-4 bg-muted/30 rounded-xl">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Camera className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Ready to Scan QR Codes
                    </h3>
                    <p className="text-muted-foreground text-center mb-6 max-w-md">
                      Click the button below to start the camera and scan
                      student QR codes
                    </p>

                    {/* Info card */}
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 max-w-md">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div className="text-sm space-y-1">
                          <p className="font-semibold">
                            Camera Permission Required
                          </p>
                          <p className="text-muted-foreground">
                            Your browser will ask for camera access when you
                            start scanning. Please click "Allow" to enable QR
                            code scanning.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanner Controls */}
              <div className="flex flex-col gap-3">
                {!isScanning ? (
                  <Button
                    onClick={startScanning}
                    className="flex-1 py-4"
                    size="lg"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Start Scanner
                  </Button>
                ) : (
                  <Button
                    onClick={stopScanning}
                    variant="outline"
                    className="flex-1 py-4"
                    size="lg"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Stop Scanner
                  </Button>
                )}
                <Button
                  onClick={handleEndSession}
                  variant="destructive"
                  size="lg"
                >
                  End Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scanned Students Summary */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-base px-3 py-1">
              <Users className="h-4 w-4 mr-1" />
              {scannedStudents.length}
            </Badge>
            <span className="text-sm text-muted-foreground">
              students scanned
            </span>
          </div>
        </div>

        {/* Scanned Students List */}
        {scannedStudents.length === 0 ? (
          <Card className="border-2 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Scan className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                No students scanned yet
              </h3>
              <p className="text-muted-foreground">
                Start scanning to mark attendance
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 shadow-lg">
            <CardContent className="p-0">
              <div className="divide-y">
                {scannedStudents.map((student, index) => (
                  <div
                    key={`${student.id}-${index}`}
                    className={`p-5 transition-all duration-500 ${
                      index === 0
                        ? 'bg-muted/50 animate-pulse-once'
                        : 'hover:bg-muted/30'
                    }`}
                    style={{
                      animation:
                        index === 0 ? 'highlightFade 2s ease-out' : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                            index === 0
                              ? 'bg-primary/20 border animate-bounce-once'
                              : 'bg-primary/20'
                          }`}
                        >
                          <CheckCircle2
                            className={`h-6 w-6 ${
                              index === 0
                                ? 'text-primary dark:text-primary'
                                : 'text-primary dark:text-primary'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base mb-1">
                            {student.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {student.studentId} • {student.scannedAt}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="">
                        Present
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
