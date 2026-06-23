'use client'

import { useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { useChatStore } from '@/store/chat-store'
import { api } from '@/lib/api'
import { ChatMessage } from './ChatMessage'
import { QuestionInput } from './QuestionInput'
import { ProgressBar } from './ProgressBar'
import { TypingIndicator } from './TypingIndicator'
import { PreviewScreen } from './PreviewScreen'
import { DoneScreen } from './DoneScreen'
import { ChevronRight, ClipboardList, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { ThemeToggle } from '../shared/ThemeToggle'

export function ChatInterface() {
  const {
    sessionUuid, currentQuestionIndex, questions, messages,
    screen, isTyping, answers,
    setSessionUuid, setQuestions, addMessage, saveAnswer,
    nextQuestion, goBack, setTyping, setScreen,
    setCurrentQuestionIndex,
  } = useChatStore()

  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  const addBotMessage = useCallback(
    (content: string, questionId?: number) => {
      addMessage({ id: uuidv4(), role: 'bot', content, questionId, timestamp: new Date() })
    },
    [addMessage]
  )

  const showQuestion = useCallback(
    async (index: number, qs: typeof questions) => {
      if (index >= qs.length) return
      setTyping(true)
      await new Promise((r) => setTimeout(r, 800))
      setTyping(false)
      const q = qs[index]
      addBotMessage(
        q.description ? `${q.title}\n\n${q.description}` : q.title,
        q.id
      )
    },
    [addBotMessage, setTyping]
  )

  // Bootstrap
  useEffect(() => {
    if (initialized.current || screen === 'done') return
    initialized.current = true
    ;(async () => {
      try {
        const qs = await api.getQuestions()
        setQuestions(qs)

        let uuid = sessionUuid
        if (!uuid) {
          uuid = uuidv4()
          setSessionUuid(uuid)
          await api.createSession(uuid)
        }

        // Restore answers from server (handles page reload)
        if (uuid) {
          const serverData = await api.getSessionAnswers(uuid).catch(() => null)
          if (serverData) {
            serverData.answers.forEach((a) => {
              saveAnswer(a.question_id, a.answer_value)
            })
            // Resume from the last unanswered question
            const answeredIds = new Set(serverData.answers.map((a) => a.question_id))
            const nextIdx = qs.findIndex((q) => !answeredIds.has(q.id))
            const resumeIdx = nextIdx === -1 ? qs.length : nextIdx

            if (resumeIdx > 0 && messages.length === 0) {
              // Already has answers — reconstruct messages silently and jump
              setCurrentQuestionIndex(resumeIdx)
              if (resumeIdx < qs.length) {
                // greet
                addBotMessage('مرحباً مجدداً! 👋\n\nيبدو أنك عدت لإكمال الاستبيان. فلنكمل من حيث توقفنا.')
                await showQuestion(resumeIdx, qs)
              } else {
                // all answered — go to preview
                setScreen('preview')
              }
              return
            }
          }
        }

        if (messages.length === 0) {
          setTyping(true)
          await new Promise((r) => setTimeout(r, 1000))
          setTyping(false)
          addBotMessage(
            'مرحباً بك! 👋\n\nيسعدنا خدمتك. سنطرح عليك بعض الأسئلة البسيطة لنفهم احتياجاتك بشكل أفضل.'
          )
          await showQuestion(currentQuestionIndex, qs)
        } else if (screen === 'chat') {
          // Restored from localStorage — show current question if not answered
          const curQ = qs[currentQuestionIndex]
          if (curQ && answers[curQ.id] === undefined) {
            await showQuestion(currentQuestionIndex, qs)
          }
        }
      } catch {
        toast.error('حدث خطأ في تحميل الأسئلة. يرجى تحديث الصفحة.')
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = async (value: string) => {
    if (!sessionUuid || currentQuestionIndex >= questions.length) return

    const question = questions[currentQuestionIndex]

    addMessage({ id: uuidv4(), role: 'user', content: value, timestamp: new Date() })

    try {
      await api.saveAnswer(sessionUuid, question.id, value)
      saveAnswer(question.id, value)

      const nextIdx = currentQuestionIndex + 1
      nextQuestion()

      if (nextIdx >= questions.length) {
        // All questions answered — show preview
        setTyping(true)
        await new Promise((r) => setTimeout(r, 900))
        setTyping(false)
        addBotMessage(
          'رائع! 🎉 لقد أجبت على جميع الأسئلة.\n\nيمكنك الآن مراجعة إجاباتك قبل الإرسال النهائي.'
        )
        await new Promise((r) => setTimeout(r, 600))
        setScreen('preview')
      } else {
        await showQuestion(nextIdx, questions)
      }
    } catch {
      toast.error('حدث خطأ في حفظ إجابتك. حاول مرة أخرى.')
    }
  }

  // ── Navigate back one question ─────────────────────────────────────────────
  const handleGoBack = async () => {
    if (currentQuestionIndex === 0) return
    goBack()
    const prevIdx = currentQuestionIndex - 1
    const prevQ = questions[prevIdx]
    if (!prevQ) return

    // Re-show the previous question in chat
    setTyping(true)
    await new Promise((r) => setTimeout(r, 400))
    setTyping(false)
    addBotMessage(
      `لنعد إلى السؤال السابق:\n\n${prevQ.description ? `${prevQ.title}\n\n${prevQ.description}` : prevQ.title}`,
      prevQ.id
    )
  }

  // ── Render screens ─────────────────────────────────────────────────────────
  if (screen === 'preview') return <PreviewScreen />
  if (screen === 'done') return <DoneScreen />

  const currentQuestion = questions[currentQuestionIndex]
  const progressIndex = Math.min(currentQuestionIndex + 1, questions.length)

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100
                      dark:border-gray-800 px-4 py-3 flex items-center
                      justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {/* Back button */}
          {currentQuestionIndex > 0 && !isTyping && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleGoBack}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800
                         transition-colors text-gray-500 dark:text-gray-400"
              title="العودة للسؤال السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500
                          to-blue-700 flex items-center justify-center
                          text-white font-bold text-lg">
            ب
          </div>
          <div>
            <h1 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
              مساعد العملاء
            </h1>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500 dark:text-gray-400">متصل الآن</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview shortcut */}
          {Object.keys(answers).length > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setScreen('preview')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                         text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950
                         rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900
                         transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              مراجعة الإجابات
            </motion.button>
          )}

          {/* Theme toggle */}
          <ThemeToggle/>
        </div>
      </div>

      {/* Progress bar */}
      {questions.length > 0 && (
        <ProgressBar current={progressIndex} total={questions.length} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="max-w-2xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {isTyping && <TypingIndicator />}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {currentQuestion && !isTyping && (
        <div className="max-w-2xl mx-auto w-full">
          <QuestionInput
            key={currentQuestion.id}
            question={currentQuestion}
            onSubmit={handleAnswer}
          />
        </div>
      )}
    </div>
  )
}