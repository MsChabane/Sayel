import { toast } from "sonner"
import { AdminCreate, AdminUser, DashboardStats, Question, QuestionCreate, SessionAnswersResponse, Submission, SubmissionDetail } from "./types"
import { redirect } from "next/navigation"


const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => ({ detail: 'Request failed' }))
  if (!res.ok) {
   if (res.status === 401){
       toast.error(data.detail)
       if(typeof window !== 'undefined'){
      
       }
   }
  throw new Error(data.detail || `HTTP ${res.status}`)
    
  }

  return data
}

// ── Types ──────────────────────────────────────────────────────────────────────


// ── API surface ────────────────────────────────────────────────────────────────

export const api = {
  // Public
  getQuestions: () => request<Question[]>('/questions'),

  createSession: (uuid: string) =>
    request<{ id: number; session_uuid: string; status: string }>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ session_uuid: uuid }),
    }),

  saveAnswer: (sessionUuid: string, questionId: number, answerValue: string) =>
    request('/answers', {
      method: 'POST',
      body: JSON.stringify({ session_uuid: sessionUuid, question_id: questionId, answer_value: answerValue }),
    }),

  /** Update one or many answers before final submission (preview screen). */
  updateAnswers: (sessionUuid: string, answers: { question_id: number; answer_value: string }[]) =>
    request('/answers', {
      method: 'PUT',
      body: JSON.stringify({ session_uuid: sessionUuid, answers }),
    }),

  /** Fetch all stored answers for a session (resume + preview). */
  getSessionAnswers: (sessionUuid: string) =>
    request<SessionAnswersResponse>(`/sessions/${sessionUuid}/answers`),

  completeSession: (sessionUuid: string) =>
    request<{ message: string; sheets_synced: boolean }>('/complete', {
      method: 'POST',
      body: JSON.stringify({ session_uuid: sessionUuid }),
    }),

  // Admin
  adminLogin: async (email: string, password: string) =>{
    const data = await request<{ access_token: string; refresh_token: string; token_type: string,admin:{
      id:number,name:string,is_super_admin:boolean,eamil:string
    } }>(
      '/admin/login',
      { method: 'POST', body: JSON.stringify({ email, password }) })

    localStorage.setItem("admin_token",data.access_token)
    localStorage.setItem("admin_refresh_token",data.refresh_token)
    return data ;
    },
   adminLogOut:()=>{
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_refresh_token")
   }, 

  getMe: () => request<AdminUser>('/admin/me'),
  getDashboard: () => request<DashboardStats>('/admin/dashboard'),

  adminGetQuestions: () => request<Question[]>('/admin/questions'),
  adminGetQuestion: (id: number) => request<Question>(`/admin/questions/${id}`),
  createQuestion: (data: QuestionCreate) =>
    request<Question>('/admin/questions', { method: 'POST', body: JSON.stringify(data) }),
  updateQuestion: (id: number, data: Partial<QuestionCreate>) =>
    request<Question>(`/admin/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuestion: (id: number) =>
    request(`/admin/questions/${id}`, { method: 'DELETE' }),
  reorderQuestions: (ids: number[]) =>
    request('/admin/questions/reorder', {
      method: 'POST',
      body: JSON.stringify({ question_ids: ids }),
    }),

  getSubmissions: (skip = 0, limit = 50) =>
    request<Submission[]>(`/admin/submissions?skip=${skip}&limit=${limit}`),
  getSubmission: (uuid: string) =>
    request<SubmissionDetail>(`/admin/submissions/${uuid}`),

  getUsers: () => request<AdminUser[]>('/admin/users'),
  createUser: (data: AdminCreate) =>
    request<AdminUser>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  deleteUser: (id: number) => request(`/admin/users/${id}`, { method: 'DELETE' }),
}
