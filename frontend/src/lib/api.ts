import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('metis_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('metis_token')
      localStorage.removeItem('metis_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Types
export interface User {
  id: number
  email: string
  username: string
  full_name: string
  department: string
  avatar_initials: string
  is_admin: boolean
  is_active: boolean
  xp: number
  level: number
  streak: number
  last_login: string | null
  created_at: string
}

export interface UserStats {
  xp: number
  level: number
  xp_to_next: number
  streak: number
  quiz_attempts: number
  courses_completed: number
  tools_used: number
  best_quiz_score: number | null
  rank: number | null
}

export interface QuizInfo {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  xp_reward: number
  question_count: number
  time_estimate: string
  min_level: number
  best_score: number | null
  attempts: number
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
  type: string
}

export interface QuizDetail {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  xp_reward: number
  questions: QuizQuestion[]
  min_level: number
}

export interface QuizResult {
  score_pct: number
  xp_earned: number
  correct_count: number
  total_questions: number
  passed: boolean
  message: string
  new_xp: number
  new_level: number
}

export interface LeaderboardEntry {
  rank: number
  user_id: number
  username: string
  full_name: string
  department: string
  avatar_initials: string
  xp: number
  level: number
  is_current_user: boolean
}

export interface Event {
  id: number
  title: string
  description: string
  event_type: string
  host: string
  event_date: string
  event_time: string
  location: string
  tags: string
  xp_reward: number
  capacity: number
  registered_count: number
  source_url: string
  is_active: boolean
  is_registered: boolean
}

export interface PlatformStats {
  total_users: number
  active_today: number
  quizzes_taken_today: number
  avg_score: number
  total_xp_awarded: number
  total_events: number
}
