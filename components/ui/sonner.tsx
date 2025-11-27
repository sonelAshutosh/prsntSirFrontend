'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-surface-container group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:font-sans',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-full',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-full',
          error:
            'group-[.toaster]:bg-error-container group-[.toaster]:text-error-on-container group-[.toaster]:border-error',
          success:
            'group-[.toaster]:bg-primary-container group-[.toaster]:text-primary-on-container group-[.toaster]:border-primary',
          warning:
            'group-[.toaster]:bg-tertiary-container group-[.toaster]:text-tertiary-on-container group-[.toaster]:border-tertiary',
          info: 'group-[.toaster]:bg-secondary-container group-[.toaster]:text-secondary-on-container group-[.toaster]:border-secondary',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
