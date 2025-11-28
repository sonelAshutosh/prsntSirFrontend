'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import { toast } from 'sonner'

function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await authAPI.login(formData)

      if (response.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        toast.success('Login successful!', {
          description: `Welcome back, ${response.data.user.firstName}!`,
        })

        // Redirect to home page
        router.push('/')
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Login failed. Please try again.'
      toast.error('Login failed', {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-none bg-surface-container-low shadow-none sm:shadow-lg sm:border sm:bg-card">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-normal tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label
                htmlFor="email"
                className="text-xs text-muted-foreground text-center block"
              >
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="text-center"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="password"
                className="text-xs text-muted-foreground text-center block"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="text-center"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Checkbox could be added here */}
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground">
                  Remember me
                </label>
              </div>
              <a
                href="#"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full text-base"
              size="lg"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default LoginPage
