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

export default api
