'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, ChevronRight, Pencil, X,
  Send, AlertCircle, RotateCcw,
} from 'lucide-react'
import { useChatStore, Question } from '@/store/chat-store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { ChoiceButtons } from './ChoiceButtons'

// ── Inline answer editor ───────────────────────────────────────────────────────

interface AnswerEditorProps {
  question: Question
  currentValue: string
  onSave: (value: string) => void
  onCancel: () => void
}

function AnswerEditor({ question, currentValue, onSave, onCancel }: AnswerEditorProps) {
  const [value, setValue] = useState(currentValue)

  const inputClass =
    'w-full px-4 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-600 ' +
    'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 ' +
    'focus:outline-none focus:border-blue-500 text-sm transition-colors'

  const handleChoiceSubmit = (v: string) => {
    setValue(v)
    onSave(v)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-3 space-y-3"
    >
      {(question.type === 'single_choice' || question.type === 'multi_choice') ? (
        <ChoiceButtons
          options={question.options}
          type={question.type as 'single_choice' | 'multi_choice'}
          initialSelected={currentValue.split('، ')}
          onSubmit={handleChoiceSubmit}
        />
      ) : question.type === 'textarea' ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${inputClass} resize-none`}
        />
      ) : (
        <input
          type={
            question.type === 'email' ? 'email'
            : question.type === 'phone' ? 'tel'
            : question.type === 'number' ? 'number'
            : question.type === 'date' ? 'date'
            : 'text'
          }
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={inputClass}
        />
      )}

      {question.type !== 'single_choice' && (
        <div className="flex gap-2">
          <button
            onClick={() => onSave(value)}
            disabled={!value.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white
                       rounded-xl text-sm font-medium hover:bg-blue-700
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            حفظ
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200
                       dark:border-gray-700 rounded-xl text-sm text-gray-600
                       dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800
                       transition-colors"
          >
            <X className="w-4 h-4" />
            إلغاء
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ── Main preview screen ────────────────────────────────────────────────────────

export function PreviewScreen() {
  const {
    sessionUuid, questions, answers,
    updateAnswer, setScreen,
  } = useChatStore()

  const [editingId, setEditingId] = useState<number | null>(null)
  const [pendingEdits, setPendingEdits] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Questions that have been answered
  const answered = questions.filter((q) => answers[q.id] !== undefined)
  const unanswered = questions.filter(
    (q) => q.required && answers[q.id] === undefined
  )

  const handleEditSave = (questionId: number, value: string) => {
    setPendingEdits((prev) => ({ ...prev, [questionId]: value }))
    updateAnswer(questionId, value)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!sessionUuid) return
    setSubmitting(true)

    try {
      // Flush any pending edits to backend
      const edits = Object.entries(pendingEdits).map(([qid, val]) => ({
        question_id: Number(qid),
        answer_value: val,
      }))

      if (edits.length > 0) {
        await api.updateAnswers(sessionUuid, edits)
      }

      const result = await api.completeSession(sessionUuid)
      toast.success(
        result.sheets_synced
          ? 'تم إرسال استبيانك وحفظه في قاعدة البيانات ✓'
          : 'تم إرسال استبيانك بنجاح ✓'
      )
      setScreen('done')
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الإرسال')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b
                      border-gray-100 dark:border-gray-800 px-4 py-4 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setScreen('chat')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800
                       transition-colors text-gray-600 dark:text-gray-400"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-gray-800 dark:text-gray-100">
              مراجعة إجاباتك
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              راجع إجاباتك قبل الإرسال النهائي
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-3">

          {/* Warning if required questions unanswered */}
          {unanswered.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 px-4 py-3 bg-amber-50
                         dark:bg-amber-950 border border-amber-200
                         dark:border-amber-800 rounded-2xl"
            >
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  بعض الأسئلة الإلزامية لم تُجب عليها
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  {unanswered.map((q) => q.title).join(' • ')}
                </p>
              </div>
            </motion.div>
          )}

          {/* Q&A cards */}
          {answered.map((q, index) => {
            const isEditing = editingId === q.id
            const displayValue = answers[q.id] ?? ''
            const wasEdited = pendingEdits[q.id] !== undefined

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`bg-white dark:bg-gray-900 rounded-2xl border
                            ${isEditing
                              ? 'border-blue-300 dark:border-blue-700 shadow-md shadow-blue-50 dark:shadow-blue-950'
                              : 'border-gray-100 dark:border-gray-800'
                            } overflow-hidden`}
              >
                {/* Question header */}
                <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950
                                     text-blue-600 dark:text-blue-400 text-xs font-bold
                                     flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {q.title}
                      </p>
                      {/* Slug badge — for admin transparency */}
                      <span className="inline-block mt-1 text-xs font-mono px-2 py-0.5
                                       bg-gray-100 dark:bg-gray-800 text-gray-400
                                       dark:text-gray-500 rounded-md">
                        {q.slug}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {wasEdited && (
                      <span className="text-xs px-2 py-0.5 bg-green-50 dark:bg-green-950
                                       text-green-600 dark:text-green-400 rounded-full">
                        تم التعديل
                      </span>
                    )}
                    <button
                      onClick={() => setEditingId(isEditing ? null : q.id)}
                      className={`p-1.5 rounded-lg transition-colors
                                  ${isEditing
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950'
                                  }`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Current answer */}
                <div className="px-5 pb-4">
                  {!isEditing && (
                    <p className="text-gray-800 dark:text-gray-100 text-sm
                                  leading-relaxed bg-gray-50 dark:bg-gray-800
                                  rounded-xl px-4 py-3">
                      {displayValue || (
                        <span className="text-gray-400 italic">لا توجد إجابة</span>
                      )}
                    </p>
                  )}

                  <AnimatePresence>
                    {isEditing && (
                      <AnswerEditor
                        question={q}
                        currentValue={displayValue}
                        onSave={(v) => handleEditSave(q.id, v)}
                        onCancel={() => setEditingId(null)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}

          {/* Unanswered required questions — shown as empty */}
          {unanswered.map((q, index) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (answered.length + index) * 0.04 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border
                         border-red-200 dark:border-red-900 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 px-5 py-4">
                <div className="flex items-start gap-3 flex-1">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {q.title}
                    </p>
                    <p className="text-xs text-red-500 mt-1">لم تُجب على هذا السؤال</p>
                  </div>
                </div>
                <button
                  onClick={() => setScreen('chat')}
                  className="text-xs text-blue-600 dark:text-blue-400
                             hover:underline whitespace-nowrap"
                >
                  الإجابة الآن
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t
                      border-gray-100 dark:border-gray-800 px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => setScreen('chat')}
            className="flex items-center gap-2 px-5 py-3 border border-gray-200
                       dark:border-gray-700 rounded-2xl text-sm font-medium
                       text-gray-600 dark:text-gray-400
                       hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            العودة
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting || unanswered.length > 0}
            className="flex-1 flex items-center justify-center gap-2 py-3
                       bg-blue-600 text-white rounded-2xl font-medium text-sm
                       hover:bg-blue-700 disabled:opacity-50
                       disabled:cursor-not-allowed transition-all duration-200
                       shadow-md shadow-blue-200 dark:shadow-blue-900"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent
                              rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                إرسال الاستبيان نهائياً
              </>
            )}
          </button>
        </div>

        {unanswered.length > 0 && (
          <p className="text-center text-xs text-red-500 mt-2">
            يرجى الإجابة على جميع الأسئلة الإلزامية أولاً
          </p>
        )}
      </div>
    </div>
  )
}