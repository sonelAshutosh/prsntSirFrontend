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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import { toast } from 'sonner'

function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as 'TEACHER' | 'STUDENT' | '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleRoleChange = (value: string) => {
    setFormData({
      ...formData,
      role: value as 'TEACHER' | 'STUDENT',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validation
    if (!formData.role) {
      toast.error('Validation error', {
        description: 'Please select a role',
      })
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Validation error', {
        description: 'Passwords do not match',
      })
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      toast.error('Validation error', {
        description: 'Password must be at least 6 characters',
      })
      setIsLoading(false)
      return
    }

    try {
      const { confirmPassword, ...signupData } = formData
      const response = await authAPI.signup(signupData as any)

      if (response.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        toast.success('Account created successfully!', {
          description: `Welcome, ${response.data.user.firstName}!`,
        })

        // Redirect to home page
        router.push('/')
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Signup failed. Please try again.'
      toast.error('Signup failed', {
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
              <UserPlus className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-normal tracking-tight">
            Create an account
          </CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="firstName"
                  className="text-xs text-muted-foreground text-center block"
                >
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  className="text-center"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="lastName"
                  className="text-xs text-muted-foreground text-center block"
                >
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  className="text-center"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="email"
                className="text-xs text-muted-foreground text-center block"
              >
                Email
              </Label>
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
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground text-center block">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
                disabled={isLoading}
                required
              >
                <SelectTrigger className="text-center">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="password"
                className="text-xs text-muted-foreground text-center block"
              >
                Password
              </Label>
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
            <div className="grid gap-2">
              <Label
                htmlFor="confirmPassword"
                className="text-xs text-muted-foreground text-center block"
              >
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="text-center"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full text-base"
              size="lg"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default SignupPage
