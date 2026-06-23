'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { Question } from '@/store/chat-store'
import { ChoiceButtons } from './ChoiceButtons'

interface QuestionInputProps {
  question: Question
  onSubmit: (value: string) => void
  disabled?: boolean
}

export function QuestionInput({ question, onSubmit, disabled }: QuestionInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && question.type !== 'textarea') {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (question.type === 'single_choice' || question.type === 'multi_choice') {
    return (
      <div className="p-4">
        <ChoiceButtons
          options={question.options}
          type={question.type as 'single_choice' | 'multi_choice'}
          onSubmit={onSubmit}
        />
      </div>
    )
  }

  const inputType = {
    email: 'email',
    phone: 'tel',
    number: 'number',
    date: 'date',
    text: 'text',
  }[question.type] || 'text'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-end gap-2 p-4 bg-white dark:bg-gray-900 
                 border-t border-gray-100 dark:border-gray-800"
    >
      <div className="flex-1 relative">
        {question.type === 'textarea' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={question.placeholder || 'اكتب إجابتك هنا...'}
            disabled={disabled}
            rows={3}
            className="w-full resize-none px-4 py-3 rounded-2xl border-2 
                       border-gray-200 dark:border-gray-600
                       bg-gray-50 dark:bg-gray-800 
                       text-gray-800 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:border-blue-500 
                       dark:focus:border-blue-400
                       transition-colors text-sm leading-relaxed
                       disabled:opacity-50"
          />
        ) : (
          <input
            type={inputType}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={question.placeholder || 'اكتب إجابتك هنا...'}
            disabled={disabled}
            className="w-full px-4 py-3 rounded-2xl border-2 
                       border-gray-200 dark:border-gray-600
                       bg-gray-50 dark:bg-gray-800
                       text-gray-800 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:border-blue-500
                       dark:focus:border-blue-400
                       transition-colors text-sm
                       disabled:opacity-50"
          />
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="w-11 h-11 flex items-center justify-center rounded-full
                   bg-blue-600 text-white hover:bg-blue-700
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-md flex-shrink-0"
      >
        <Send className="w-5 h-5 rotate-180" />
      </motion.button>
    </motion.div>
  )
}