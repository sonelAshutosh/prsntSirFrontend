import React from 'react'
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
import { UserPlus, ArrowRight, User, Mail, Lock } from 'lucide-react'
import Link from 'next/link'

function SignupPage() {
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
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label
              htmlFor="name"
              className="text-xs text-muted-foreground text-center block"
            >
              Full Name
            </Label>
            <div className="relative">
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className="text-center"
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
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="text-center"
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
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="confirm-password"
              className="text-xs text-muted-foreground text-center block"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                className="text-center"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full text-base" size="lg">
            Sign up <ArrowRight className="ml-2 h-4 w-4" />
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
      </Card>
    </div>
  )
}

export default SignupPage
