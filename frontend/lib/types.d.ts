
export interface QuestionOption {
  id: number
  label: string
  value: string
  order_index: number
}

export interface Question {
  id: number
  title: string
  slug: string           // ← NEW — Google Sheets column header
  description: string | null
  type: string
  required: boolean
  placeholder: string | null
  order_index: number
  is_active: boolean
  options: QuestionOption[]
  created_at: string
}

export interface QuestionCreate {
  title: string
  slug: string
  description?: string
  type: string
  required: boolean
  placeholder?: string
  options: { label: string; value: string; order_index: number }[]
}

export interface SessionAnswer {
  question_id: number
  question_title: string
  question_slug: string
  question_type: string
  answer_value: string
}

export interface SessionAnswersResponse {
  session_uuid: string
  status: string
  answers: SessionAnswer[]
}

export interface Submission {
  session_id: number
  session_uuid: string
  started_at: string
  completed_at: string | null
  status: string
  answer_count: number
  sheets_synced: boolean
}

export interface SubmissionDetail {
  session: {
    id: number
    session_uuid: string
    status: string
    started_at: string
    completed_at: string | null
    sheets_synced: boolean
  }
  answers: {
    question_id: number
    question_title: string
    question_type: string
    answer: string
    answered_at: string
  }[]
}

export interface DashboardStats {
  total_questions: number
  total_sessions: number
  completed_sessions: number
  abandoned_sessions: number
  completion_rate: number
  daily_submissions: { date: string; count: number }[]
  weekly_submissions: { week: string; count: number }[]
  question_completion: { question: string; rate: number }[]
}

export interface AdminUser {
  id: number
  name: string
  email: string
  is_super_admin: boolean
  is_active: boolean
  created_at: string
}

export interface AdminCreate {
  name: string
  email: string
  password: string
  is_super_admin: boolean
}
