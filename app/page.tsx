'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user')

    if (userData) {
      try {
        const user = JSON.parse(userData)

        // Redirect based on role
        if (user.role === 'TEACHER') {
          router.push('/teacher')
        } else if (user.role === 'STUDENT') {
          router.push('/student')
        } else {
          // Invalid role, redirect to login
          router.push('/login')
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/login')
      }
    } else {
      // Not logged in, redirect to login
      router.push('/login')
    }
  }, [router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
