'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Home, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useChatStore } from '@/store/chat-store'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

export function DoneScreen() {
  const reset = useChatStore((s) => s.reset)

  useEffect(() => {
    // fire confetti once
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#6366f1', '#22c55e', '#f59e0b'],
    })
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen
                    bg-gray-50 dark:bg-gray-950 px-4 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full
                   flex items-center justify-center mb-6"
      >
        <CheckCircle className="w-14 h-14 text-green-600 dark:text-green-400" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-3"
      >
        شكراً لك! 🎉
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-8"
      >
        تم استلام استبيانك بنجاح. سيتواصل معك فريقنا خلال{' '}
        <strong className="text-gray-700 dark:text-gray-200">24–48 ساعة عمل</strong>{' '}
        بأفضل الحلول لمشروعك.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-6 py-3
                     bg-blue-600 text-white rounded-2xl font-medium
                     hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          العودة للرئيسية
        </Link>

        <button
          onClick={() => { reset(); window.location.href = '/chat' }}
          className="flex items-center justify-center gap-2 px-6 py-3
                     border border-gray-200 dark:border-gray-700 rounded-2xl
                     font-medium text-gray-600 dark:text-gray-400
                     hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          بدء استبيان جديد
        </button>
      </motion.div>
    </div>
  )
}