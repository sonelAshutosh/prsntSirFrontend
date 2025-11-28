import axios from 'axios'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface LoginData {
  email: string
  password: string
}

export interface SignupData {
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'TEACHER' | 'STUDENT'
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      role: string
      profileImage: string | null
    }
    token: string
  }
}

export const authAPI = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', data)
    return response.data
  },
}

// User Profile Interfaces
export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  email?: string
}

export interface UpdateProfilePictureData {
  profileImage: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface DeleteAccountData {
  password: string
}

export interface UserResponse {
  success: boolean
  message: string
  data?: {
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      role: string
      profileImage: string | null
      createdAt: string
      updatedAt: string
    }
  }
}

// User API
export const userAPI = {
  getProfile: async (): Promise<UserResponse> => {
    const response = await api.get('/user/profile')
    return response.data
  },

  updateProfile: async (data: UpdateProfileData): Promise<UserResponse> => {
    const response = await api.put('/user/profile', data)
    return response.data
  },

  updateProfilePicture: async (
    data: UpdateProfilePictureData
  ): Promise<UserResponse> => {
    const response = await api.put('/user/profile-picture', data)
    return response.data
  },

  changePassword: async (
    data: ChangePasswordData
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/user/change-password', data)
    return response.data
  },

  deleteAccount: async (
    data: DeleteAccountData
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/user/account', { data })
    return response.data
  },
}

export default api
