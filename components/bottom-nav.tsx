'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()
  const [userRole, setUserRole] = React.useState<'TEACHER' | 'STUDENT' | null>(
    null
  )

  React.useEffect(() => {
    // Get user role from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.role)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  // Hide bottom nav on login and signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return null
  }

  // Determine routes based on user role
  const classesRoute =
    userRole === 'TEACHER' ? '/teacher/classrooms' : '/student/classrooms'
  const homeRoute = userRole === 'TEACHER' ? '/teacher' : '/student'

  const items = [
    {
      label: 'Home',
      icon: Home,
      href: homeRoute,
    },
    {
      label: 'Classes',
      icon: BookOpen,
      href: classesRoute,
    },
    {
      label: 'Profile',
      icon: User,
      href: '/profile',
    },
  ]

  return (
    <div className="bg-background fixed bottom-0 left-0 right-0 z-50 bg-surface-container-low border-t border-border shadow-md md:hidden">
      <nav className="flex h-20 items-center justify-around px-2 pb-2">
        {items.map((item) => {
          const isActive =
            item.href === homeRoute
              ? pathname === item.href
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col items-center justify-center gap-1 w-full"
            >
              <div
                className={cn(
                  'flex h-8 w-16 items-center justify-center rounded-full transition-colors duration-200',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground group-hover:bg-accent'
                )}
              >
                <item.icon
                  className={cn('h-6 w-6', isActive ? 'fill-current' : '')}
                />
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
