'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarCheck, User, Settings, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

  // Hide bottom nav on login and signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return null
  }

  const items = [
    {
      label: 'Home',
      icon: Home,
      href: '/',
    },
    {
      label: 'Attendance',
      icon: CalendarCheck,
      href: '/attendance',
    },
    {
      label: 'Add',
      icon: PlusCircle,
      href: '/add', // Placeholder for an action or page
    },
    {
      label: 'Profile',
      icon: User,
      href: '/profile',
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/settings',
    },
  ]

  return (
    <div className="bg-background fixed bottom-0 left-0 right-0 z-50 bg-surface-container-low border-t border-border shadow-md md:hidden">
      <nav className="flex h-20 items-center justify-around px-2 pb-2">
        {items.map((item) => {
          const isActive = pathname === item.href
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
                    ? 'bg-secondary-container text-secondary-on-container'
                    : 'text-muted-foreground group-hover:bg-surface-container-high'
                )}
              >
                <item.icon
                  className={cn('h-6 w-6', isActive ? 'fill-current' : '')}
                />
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-200',
                  isActive ? 'text-on-surface' : 'text-muted-foreground'
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
