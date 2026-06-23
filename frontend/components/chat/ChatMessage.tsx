'use client'

import { motion } from 'framer-motion'
import { ChatMessage as ChatMessageType } from '@/store/chat-store'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.role === 'bot'

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-end gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center 
                        justify-center text-white text-xs font-bold flex-shrink-0 mb-1">
          ب
        </div>
      )}

      <div className={`max-w-[80%] ${isBot ? 'animate-slide-left' : 'animate-slide-right'}`}>
        <div className={isBot ? 'chat-bubble-bot px-4 py-3' : 'chat-bubble-user px-4 py-3'}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className={`text-xs text-gray-400 mt-1 ${isBot ? 'text-right' : 'text-left'}`}>
          {format(new Date(message.timestamp), 'HH:mm', { locale: ar })}
        </p>
      </div>

      {!isBot && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 
                        flex items-center justify-center text-gray-600 
                        dark:text-gray-300 text-xs font-bold flex-shrink-0 mb-1">
          أ
        </div>
      )}
    </motion.div>
  )
}