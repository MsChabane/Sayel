'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-end gap-2 justify-start"
    >
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center 
                      justify-center text-white text-xs font-bold flex-shrink-0">
        ب
      </div>
      <div className="chat-bubble-bot px-4 py-3">
        <div className="flex items-center gap-1">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </motion.div>
  )
}