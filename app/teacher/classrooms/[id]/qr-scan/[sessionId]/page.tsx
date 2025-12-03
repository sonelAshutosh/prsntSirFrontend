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
import { BrowserQRCodeReader } from '@zxing/browser'

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
  const [isInsecureContext, setIsInsecureContext] = useState(false)
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null)

  // Cooldown tracking to prevent duplicate scans
  const scanCooldownRef = useRef<Map<string, number>>(new Map())
  const SCAN_COOLDOWN_MS = 3000 // 3 seconds cooldown per QR code

  // Check if running on insecure context (HTTP on non-localhost)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isHttp = window.location.protocol === 'http:'
      const isNotLocalhost =
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      setIsInsecureContext(isHttp && isNotLocalhost)
    }
  }, [])

  // Fetch already marked students when page loads
  useEffect(() => {
    const fetchMarkedStudents = async () => {
      try {
        const response = await attendanceAPI.getMarkedStudents(sessionId)
        if (response.success && response.data.markedStudents) {
          setScannedStudents(response.data.markedStudents)
          console.log(
            'Loaded marked students:',
            response.data.markedStudents.length
          )
        }
      } catch (error) {
        console.error('Error fetching marked students:', error)
      }
    }

    fetchMarkedStudents()
  }, [sessionId])

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (codeReaderRef.current && isScanning) {
        try {
          const videoElement = document.getElementById(
            'qr-video'
          ) as HTMLVideoElement
          if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject as MediaStream
            stream.getTracks().forEach((track) => track.stop())
          }
        } catch (err) {
          console.error('Error cleaning up:', err)
        }
      }
    }
  }, [isScanning])

  const startScanning = async () => {
    try {
      console.log('Starting QR scanner with ZXing...')

      // Check if running on HTTPS (required for mobile)
      if (
        window.location.protocol === 'http:' &&
        window.location.hostname !== 'localhost'
      ) {
        toast.error('HTTPS Required', {
          description:
            'Camera access requires HTTPS on mobile devices. Please use HTTPS or access from the same device.',
          duration: 7000,
        })
        console.error('Camera access requires HTTPS for remote connections')
        return
      }

      // Initialize ZXing reader
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader()
      }

      // Get available video devices using navigator.mediaDevices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput'
      )

      console.log('Available cameras:', videoDevices)

      if (!videoDevices || videoDevices.length === 0) {
        toast.error('No camera found', {
          description: 'Please connect a camera and try again',
        })
        return
      }

      // Try to find rear camera first, fallback to first available
      const selectedDevice =
        videoDevices.find((device) =>
          device.label.toLowerCase().includes('back')
        ) ||
        videoDevices.find((device) =>
          device.label.toLowerCase().includes('rear')
        ) ||
        videoDevices[0]

      console.log('Using camera:', selectedDevice.label)

      setIsScanning(true)

      // Start decoding from video device
      codeReaderRef.current.decodeFromVideoDevice(
        selectedDevice.deviceId,
        'qr-video',
        (result, error) => {
          if (result) {
            console.log('QR Code detected:', result.getText())
            onScanSuccess(result.getText())
          }
          // Ignore errors - they happen constantly while scanning
        }
      )

      // Hide loading overlay after camera starts
      setTimeout(() => {
        const loadingOverlay = document.getElementById('camera-loading')
        if (loadingOverlay) {
          loadingOverlay.style.display = 'none'
        }
      }, 1000)

      toast.success('Scanner started', {
        description: 'Point camera at student QR code',
      })
    } catch (err: any) {
      console.error('Error starting scanner:', err)

      // Provide specific error messages
      let errorDescription = 'Please check camera permissions'

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        errorDescription =
          'Camera access denied. Please allow camera permissions in your browser settings.'
      } else if (err.name === 'NotFoundError') {
        errorDescription =
          'No camera found. Please connect a camera and refresh the page.'
      } else if (
        err.name === 'NotReadableError' ||
        err.name === 'TrackStartError'
      ) {
        errorDescription =
          'Camera is already in use by another application. Please close other apps using the camera.'
      } else if (
        err.name === 'NotSupportedError' ||
        err.message?.includes('secure')
      ) {
        errorDescription =
          'Camera access requires HTTPS on mobile devices. Please use a secure connection.'
      } else if (err.message) {
        errorDescription = err.message
      }

      setIsScanning(false)
      toast.error('Failed to start scanner', {
        description: errorDescription,
        duration: 5000,
      })
    }
  }

  const stopScanning = async () => {
    try {
      const videoElement = document.getElementById(
        'qr-video'
      ) as HTMLVideoElement
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
        videoElement.srcObject = null
      }
      setIsScanning(false)
      toast.info('Scanner stopped')
      console.log('Scanner stopped successfully')
    } catch (err: any) {
      console.error('Error stopping scanner:', err)
      setIsScanning(false)
    }
  }

  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      )

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (err) {
      console.warn('Could not play beep:', err)
    }
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
    console.log('QR Code detected:', decodedText)

    // Check cooldown to prevent duplicate scans
    const now = Date.now()
    const lastScanTime = scanCooldownRef.current.get(decodedText)

    if (lastScanTime && now - lastScanTime < SCAN_COOLDOWN_MS) {
      console.log(
        `Cooldown active for ${decodedText}, ignoring scan (${Math.round(
          (SCAN_COOLDOWN_MS - (now - lastScanTime)) / 1000
        )}s remaining)`
      )
      return
    }

    if (isProcessing) {
      console.log('Already processing, skipping...')
      return
    }

    // Add to cooldown immediately to prevent rapid re-scans
    scanCooldownRef.current.set(decodedText, now)

    setIsProcessing(true)
    console.log('Processing QR code...')

    try {
      const response = await attendanceAPI.scanQRCode(sessionId, decodedText)
      console.log('API Response:', response)

      if (response.success && response.data) {
        const student: ScannedStudent = {
          ...response.data.student,
          scannedAt: new Date().toLocaleTimeString(),
          status: response.data.record.status,
        }

        setScannedStudents((prev) => [student, ...prev])

        playBeep()
        showSuccessOverlay()

        toast.success('Attendance marked!', {
          description: `${student.name} - Present`,
          duration: 3000,
        })

        console.log('Attendance marked successfully for:', student.name)
      }
    } catch (error: any) {
      console.error('Error marking attendance:', error)
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
        console.log('Ready for next scan')

        // Clean up old cooldown entries (older than cooldown period)
        const cleanupTime = Date.now() - SCAN_COOLDOWN_MS
        for (const [qrCode, timestamp] of scanCooldownRef.current.entries()) {
          if (timestamp < cleanupTime) {
            scanCooldownRef.current.delete(qrCode)
          }
        }
      }, 1000)
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
      {/* Ensure video is visible */}
      <style jsx global>{`
        #qr-video {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
          border-radius: 12px;
        }

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
                <video
                  id="qr-video"
                  className={`w-full ${isScanning ? 'block' : 'hidden'}`}
                  style={{
                    minHeight: isScanning ? '400px' : '0',
                    maxWidth: '100%',
                  }}
                />

                {/* Loading overlay */}
                {isScanning && (
                  <div
                    className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none"
                    id="camera-loading"
                  >
                    <div className="text-white text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm">Initializing camera...</p>
                    </div>
                  </div>
                )}

                {!isScanning && (
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
