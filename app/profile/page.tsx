'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Mail,
  Shield,
  Edit,
  LogOut,
  Camera,
  Lock,
  Trash2,
  Sun,
  Moon,
} from 'lucide-react'
import { toast } from 'sonner'
import { userAPI } from '@/lib/api'
import { useTheme } from '@/components/theme-provider'
import imageCompression from 'browser-image-compression'

interface UserData {
  _id?: string
  id?: string
  firstName: string
  lastName: string
  email: string
  role: 'TEACHER' | 'STUDENT'
  profileImage?: string
  createdAt: string
  updatedAt: string
}

function ProfilePage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)

  // Form states
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [deletePassword, setDeletePassword] = useState('')

  // Loading states
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setEditFormData({
          firstName: parsedUser.firstName,
          lastName: parsedUser.lastName,
          email: parsedUser.email,
        })
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
    setIsLoading(false)
  }, [router])

  const updateLocalUser = (updatedUser: UserData) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const { deleteCookie } = await import('@/lib/cookies')
      deleteCookie('token')
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  const handleEditProfile = async () => {
    setIsUpdating(true)
    try {
      const response = await userAPI.updateProfile(editFormData)
      if (response.success && response.data) {
        updateLocalUser(response.data.user as UserData)
        toast.success('Profile updated!')
        setEditProfileOpen(false)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB')
      return
    }

    setIsUploadingImage(true)

    try {
      // Compress the image before uploading
      // Base64 encoding increases size by ~33%, so we target smaller compressed size
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.05, // Max 50KB (becomes ~67KB after base64)
        maxWidthOrHeight: 1024, // 1024px is plenty for profile pictures
        initialQuality: 0.7, // 70% quality - good balance
        useWebWorker: true,
      })

      console.log('Original file size:', (file.size / 1024).toFixed(2), 'KB')
      console.log(
        'Compressed file size:',
        (compressedFile.size / 1024).toFixed(2),
        'KB'
      )
      console.log(
        'Estimated base64 size:',
        ((compressedFile.size * 1.33) / 1024).toFixed(2),
        'KB'
      )

      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        try {
          const response = await userAPI.updateProfilePicture({
            profileImage: base64String,
          })
          if (response.success && response.data) {
            updateLocalUser(response.data.user as UserData)
            toast.success('Profile picture updated!')
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to upload image')
        } finally {
          setIsUploadingImage(false)
        }
      }
      reader.onerror = () => {
        toast.error('Failed to read file')
        setIsUploadingImage(false)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error('Image upload error:', error)
      toast.error('Failed to compress image')
      setIsUploadingImage(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordFormData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsUpdating(true)
    try {
      const response = await userAPI.changePassword({
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword,
      })

      if (response.success) {
        toast.success('Password changed!')
        setChangePasswordOpen(false)
        setPasswordFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password')
      return
    }

    setIsUpdating(true)
    try {
      const response = await userAPI.deleteAccount({
        password: deletePassword,
      })

      if (response.success) {
        toast.success('Account deleted')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        const { deleteCookie } = await import('@/lib/cookies')
        deleteCookie('token')
        setTimeout(() => router.push('/login'), 1000)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account')
      setIsUpdating(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Header */}
      <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 pt-8 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="container max-w-4xl mx-auto px-4 relative">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        </div>
      </div>

      {/* Profile Card */}
      <div className="container max-w-4xl mx-auto px-4 -mt-12 relative z-10">
        <Card className="border-2 shadow-xl mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage
                    src={user.profileImage || undefined}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                  <AvatarFallback className="text-3xl font-semibold bg-primary text-primary-foreground">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-lg opacity-100 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left space-y-4">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h2 className="text-3xl font-bold">
                      {user.firstName} {user.lastName}
                    </h2>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <Badge
                    variant={user.role === 'TEACHER' ? 'default' : 'secondary'}
                    className="w-fit mx-auto sm:mx-0 mt-4 border-2 border-primary"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4">
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2"
                    onClick={() => setEditProfileOpen(true)}
                  >
                    <Edit className="h-4 w-8" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setChangePasswordOpen(true)}
                  >
                    <Lock className="h-4 w-8" />
                    Change Password
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={toggleTheme}
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => setDeleteAccountOpen(true)}
                  >
                    <Trash2 className="h-4 w-8" />
                    Delete Account
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                value={editFormData.firstName}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    firstName: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                value={editFormData.lastName}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, lastName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditProfileOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleEditProfile} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current and new password
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordFormData.currentPassword}
                onChange={(e) =>
                  setPasswordFormData({
                    ...passwordFormData,
                    currentPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordFormData.newPassword}
                onChange={(e) =>
                  setPasswordFormData({
                    ...passwordFormData,
                    newPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordFormData.confirmPassword}
                onChange={(e) =>
                  setPasswordFormData({
                    ...passwordFormData,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChangePasswordOpen(false)
                setPasswordFormData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                })
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isUpdating}>
              {isUpdating ? 'Changing...' : 'Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and all your data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="delete-password">Enter password to confirm</Label>
            <Input
              id="delete-password"
              type="password"
              placeholder="Your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeletePassword('')}
              disabled={isUpdating}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ProfilePage
