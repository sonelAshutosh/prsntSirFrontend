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

// Student Profile Interfaces
export interface StudentProfile {
  id: string
  studentId: string
  qrCode: string
  classesJoined: Array<{
    classroomId: string
    status: 'ACTIVE' | 'LEFT'
    joinedAt: string
    leftAt: string | null
  }>
  createdAt: string
  updatedAt: string
}

export interface StudentProfileResponse {
  success: boolean
  message?: string
  data?: {
    studentProfile: StudentProfile
  }
}

// Student API
export const studentAPI = {
  getProfile: async (): Promise<StudentProfileResponse> => {
    const response = await api.get('/student/profile')
    return response.data
  },

  regenerateQR: async (): Promise<{
    success: boolean
    message: string
    data?: { qrCode: string }
  }> => {
    const response = await api.post('/student/regenerate-qr')
    return response.data
  },

  joinClass: async (
    classCode: string
  ): Promise<{
    success: boolean
    message: string
    data?: {
      classroom: Classroom
    }
  }> => {
    const response = await api.post('/student/join-class', { classCode })
    return response.data
  },

  getMyClasses: async (): Promise<ClassroomsResponse> => {
    const response = await api.get('/student/my-classes')
    return response.data
  },

  leaveClassroom: async (
    classroomId: string
  ): Promise<{
    success: boolean
    message: string
  }> => {
    const response = await api.post(`/student/leave-classroom/${classroomId}`)
    return response.data
  },
}

// Classroom Interfaces
export interface Teacher {
  _id?: string
  id?: string
  firstName: string
  lastName: string
  email: string
  profileImage?: string
}

export interface Classroom {
  id: string
  name: string
  subject: string
  code: string
  teachers: (string | Teacher)[]
  studentCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateClassroomData {
  name: string
  subject: string
}

export interface UpdateClassroomData {
  name?: string
  subject?: string
}

export interface ClassroomResponse {
  success: boolean
  message?: string
  data?: {
    classroom: Classroom
  }
}

export interface ClassroomsResponse {
  success: boolean
  data?: {
    classrooms: Classroom[]
  }
}

// Classroom API
export const classroomAPI = {
  create: async (data: CreateClassroomData): Promise<ClassroomResponse> => {
    const response = await api.post('/classroom/create', data)
    return response.data
  },

  getMyClasses: async (): Promise<ClassroomsResponse> => {
    const response = await api.get('/classroom/my-classes')
    return response.data
  },

  getById: async (id: string): Promise<ClassroomResponse> => {
    const response = await api.get(`/classroom/${id}`)
    return response.data
  },

  update: async (
    id: string,
    data: UpdateClassroomData
  ): Promise<ClassroomResponse> => {
    const response = await api.put(`/classroom/${id}`, data)
    return response.data
  },

  delete: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/classroom/${id}`)
    return response.data
  },

  regenerateCode: async (id: string): Promise<ClassroomResponse> => {
    const response = await api.post(`/classroom/${id}/regenerate-code`)
    return response.data
  },

  addCoTeacher: async (
    id: string,
    teacherEmail: string
  ): Promise<ClassroomResponse> => {
    const response = await api.post(`/classroom/${id}/add-coteacher`, {
      teacherEmail,
    })
    return response.data
  },

  removeCoTeacher: async (
    id: string,
    teacherId: string
  ): Promise<ClassroomResponse> => {
    const response = await api.post(`/classroom/${id}/remove-coteacher`, {
      teacherId,
    })
    return response.data
  },

  getStudents: async (
    id: string,
    status?: 'active' | 'left' | 'all'
  ): Promise<{
    success: boolean
    data?: {
      students: Array<{
        studentId: string
        userId: {
          _id: string
          firstName: string
          lastName: string
          email: string
          profileImage?: string
        }
        enrollmentStatus?: 'ACTIVE' | 'LEFT'
        joinedAt: string
        leftAt?: string | null
        attendanceStats?: {
          totalSessions: number
          presentCount: number
          attendancePercentage: number
        }
      }>
    }
  }> => {
    const params = status ? `?status=${status}` : ''
    const response = await api.get(`/classroom/${id}/students${params}`)
    return response.data
  },
}

// Attendance Session Interfaces
export interface AttendanceStudent {
  id: string
  firstName: string
  lastName: string
  email: string
  profileImage?: string
  studentId: string
}

export interface AttendanceSession {
  id: string
  classroomId: string
  mode: 'MANUAL' | 'QR'
  createdAt: string
  endedAt?: string
  topic?: string
}

export interface SessionStudentsResponse {
  success: boolean
  data?: {
    session: AttendanceSession
    students: AttendanceStudent[]
    totalStudents: number
    unmarkedCount: number
    markedCount: number
  }
}

export interface AttendanceSessionResponse {
  success: boolean
  message?: string
  data?: {
    session: AttendanceSession
  }
}

export interface MarkAttendanceResponse {
  success: boolean
  message?: string
  data?: {
    record: {
      id: string
      studentId: string
      status: 'PRESENT' | 'ABSENT'
      createdAt: string
    }
  }
}

// Attendance API
export const attendanceAPI = {
  createSession: async (data: {
    classroomId: string
    mode?: 'MANUAL' | 'QR'
    topic?: string
  }): Promise<AttendanceSessionResponse> => {
    const response = await api.post('/attendance/session/create', data)
    return response.data
  },

  getSessionStudents: async (
    sessionId: string
  ): Promise<SessionStudentsResponse> => {
    const response = await api.get(`/attendance/session/${sessionId}/students`)
    return response.data
  },

  markAttendance: async (
    sessionId: string,
    studentId: string,
    status: 'PRESENT' | 'ABSENT'
  ): Promise<MarkAttendanceResponse> => {
    const response = await api.post(`/attendance/session/${sessionId}/mark`, {
      studentId,
      status,
    })
    return response.data
  },

  endSession: async (sessionId: string): Promise<AttendanceSessionResponse> => {
    const response = await api.post(`/attendance/session/${sessionId}/end`)
    return response.data
  },

  getClassroomSessions: async (
    classroomId: string
  ): Promise<{
    success: boolean
    data: {
      sessions: {
        id: string
        date: string
        type: 'MANUAL' | 'QR'
        status: 'completed' | 'active'
        totalStudents: number
        presentStudents: number
        topic: string
      }[]
    }
  }> => {
    const response = await api.get(
      `/attendance/classroom/${classroomId}/sessions`
    )
    return response.data
  },

  getStudentAttendanceHistory: async (
    classroomId: string
  ): Promise<{
    success: boolean
    data: {
      history: {
        id: string
        date: string
        topic: string
        status: 'present' | 'absent'
        markedAt: string | null
      }[]
    }
  }> => {
    const response = await api.get(
      `/attendance/classroom/${classroomId}/student`
    )
    return response.data
  },

  scanQRCode: async (
    sessionId: string,
    qrData: string
  ): Promise<{
    success: boolean
    message: string
    data?: {
      student: {
        id: string
        name: string
        studentId: string
        email: string
      }
      record: {
        id: string
        status: string
        markedAt: string
      }
    }
  }> => {
    const response = await api.post(
      `/attendance/session/${sessionId}/scan-qr`,
      {
        qrData,
      }
    )
    return response.data
  },

  getActiveSession: async (
    classroomId: string
  ): Promise<{
    success: boolean
    data: {
      activeSession: AttendanceSession | null
    }
  }> => {
    const response = await api.get(
      `/attendance/classroom/${classroomId}/active-session`
    )
    return response.data
  },

  getMarkedStudents: async (
    sessionId: string
  ): Promise<{
    success: boolean
    data: {
      markedStudents: {
        id: string
        name: string
        studentId: string
        email: string
        scannedAt: string
        status: string
      }[]
    }
  }> => {
    const response = await api.get(`/attendance/session/${sessionId}/marked`)
    return response.data
  },
}

export default api
