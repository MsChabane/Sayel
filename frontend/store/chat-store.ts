import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface QuestionOption {
  id: number
  label: string
  value: string
  order_index: number
}

export interface Question {
  id: number
  title: string
  slug: string          // ← NEW
  description: string | null
  type: string
  required: boolean
  placeholder: string | null
  order_index: number
  options: QuestionOption[]
}

export interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  content: string
  questionId?: number
  timestamp: Date
}

// Every screen the chat UI can be in
export type ChatScreen = 'chat' | 'preview' | 'done'

interface ChatState {
  sessionUuid: string | null
  currentQuestionIndex: number
  questions: Question[]
  messages: ChatMessage[]
  answers: Record<number, string>   // questionId → value
  screen: ChatScreen
  isTyping: boolean

  setSessionUuid: (uuid: string) => void
  setQuestions: (questions: Question[]) => void
  addMessage: (message: ChatMessage) => void
  saveAnswer: (questionId: number, value: string) => void
  updateAnswer: (questionId: number, value: string) => void  // from preview edit
  setCurrentQuestionIndex: (index: number) => void
  nextQuestion: () => void
  goBack: () => void                // navigate to previous question
  setTyping: (typing: boolean) => void
  setScreen: (screen: ChatScreen) => void
  reset: () => void
}

const initial = {
  sessionUuid: null,
  currentQuestionIndex: 0,
  questions: [] as Question[],
  messages: [] as ChatMessage[],
  answers: {} as Record<number, string>,
  screen: 'chat' as ChatScreen,
  isTyping: false,
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ...initial,

      setSessionUuid: (uuid) => set({ sessionUuid: uuid }),
      setQuestions: (questions) => set({ questions }),
      addMessage: (message) =>
        set((s) => ({ messages: [...s.messages, message] })),
      saveAnswer: (questionId, value) =>
        set((s) => ({ answers: { ...s.answers, [questionId]: value } })),
      updateAnswer: (questionId, value) =>
        set((s) => ({ answers: { ...s.answers, [questionId]: value } })),
      setCurrentQuestionIndex: (index) =>
        set({ currentQuestionIndex: index }),
      nextQuestion: () =>
        set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1 })),
      goBack: () =>
        set((s) => ({
          currentQuestionIndex: Math.max(0, s.currentQuestionIndex - 1),
        })),
      setTyping: (isTyping) => set({ isTyping }),
      setScreen: (screen) => set({ screen }),
      reset: () => set(initial),
    }),
    {
      name: 'chat-session-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        sessionUuid: s.sessionUuid,
        currentQuestionIndex: s.currentQuestionIndex,
        messages: s.messages,
        answers: s.answers,
        screen: s.screen,
      }),
    }
  )
)