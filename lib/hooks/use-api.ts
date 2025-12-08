import useSWR, { mutate } from 'swr'
import {
  studentAPI,
  classroomAPI,
  attendanceAPI,
  type Classroom,
  type AttendanceSession,
} from '@/lib/api'

// Fetcher functions for SWR
const fetchers = {
  myClassrooms: async (key: string, role: 'student' | 'teacher') => {
    const api = role === 'student' ? studentAPI : classroomAPI
    const response = await api.getMyClasses()
    return response.data?.classrooms || []
  },

  classroom: async (key: string, id: string) => {
    const response = await classroomAPI.getById(id)
    return response.data?.classroom || null
  },

  attendanceHistory: async (key: string, classroomId: string) => {
    const response = await attendanceAPI.getStudentAttendanceHistory(
      classroomId
    )
    return response.data?.history || []
  },

  classroomSessions: async (key: string, classroomId: string) => {
    const response = await attendanceAPI.getClassroomSessions(classroomId)
    return response.data?.sessions || []
  },

  activeSession: async (key: string, classroomId: string) => {
    const response = await attendanceAPI.getActiveSession(classroomId)
    return response.data?.activeSession || null
  },

  studentProfile: async () => {
    const response = await studentAPI.getProfile()
    return response.data?.studentProfile || null
  },

  classroomStudents: async (key: string, classroomId: string) => {
    const response = await classroomAPI.getStudents(classroomId, 'active')
    return response.data?.students || []
  },
}

// Hook for fetching user's classrooms (student or teacher)
export function useMyClassrooms(role: 'student' | 'teacher') {
  const { data, error, isLoading, mutate } = useSWR(
    ['my-classrooms', role],
    ([_, role]) => fetchers.myClassrooms('my-classrooms', role),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Prevent duplicate requests within 10s
      refreshInterval: 30000, // Refresh every 30s
    }
  )

  return {
    classrooms: data as Classroom[] | undefined,
    isLoading,
    error,
    mutate,
  }
}

// Hook for fetching a single classroom
export function useClassroom(classroomId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    classroomId ? ['classroom', classroomId] : null,
    ([_, id]) => fetchers.classroom('classroom', id as string),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      refreshInterval: 60000, // Refresh every 60s
    }
  )

  return {
    classroom: data as Classroom | null | undefined,
    isLoading,
    error,
    mutate,
  }
}

// Hook for fetching student attendance history
export function useAttendanceHistory(classroomId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    classroomId ? ['attendance-history', classroomId] : null,
    ([_, id]) => fetchers.attendanceHistory('attendance-history', id as string),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 30000, // Refresh every 30s
    }
  )

  return {
    history: data,
    isLoading,
    error,
    mutate,
  }
}

// Hook for fetching classroom sessions (teacher view)
export function useClassroomSessions(classroomId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    classroomId ? ['classroom-sessions', classroomId] : null,
    ([_, id]) => fetchers.classroomSessions('classroom-sessions', id as string),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 30000, // Refresh every 30s
    }
  )

  return {
    sessions: data,
    isLoading,
    error,
    mutate,
  }
}

// Hook for fetching active session
export function useActiveSession(classroomId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    classroomId ? ['active-session', classroomId] : null,
    ([_, id]) => fetchers.activeSession('active-session', id as string),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      refreshInterval: 10000, // Refresh every 10s for active sessions
    }
  )

  return {
    activeSession: data as AttendanceSession | null | undefined,
    isLoading,
    error,
    mutate,
  }
}

// Hook for fetching student profile
export function useStudentProfile() {
  const { data, error, isLoading, mutate } = useSWR(
    'student-profile',
    fetchers.studentProfile,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      refreshInterval: 60000, // Refresh every 60s
    }
  )

  return {
    profile: data,
    isLoading,
    error,
    mutate,
  }
}

// Hook for fetching classroom students
export function useClassroomStudents(classroomId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    classroomId ? ['classroom-students', classroomId] : null,
    ([_, id]) => fetchers.classroomStudents('classroom-students', id as string),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      refreshInterval: 30000, // Refresh every 30s
    }
  )

  return {
    students: data,
    isLoading,
    error,
    mutate,
  }
}

// Helper function to manually revalidate all classroom data
export function revalidateClassroomData(classroomId: string) {
  mutate(['classroom', classroomId])
  mutate(['classroom-sessions', classroomId])
  mutate(['active-session', classroomId])
  mutate(['classroom-students', classroomId])
  mutate(['attendance-history', classroomId])
}

// Helper function to revalidate classroom lists
export function revalidateClassroomLists() {
  mutate((key) => Array.isArray(key) && key[0] === 'my-classrooms')
}
