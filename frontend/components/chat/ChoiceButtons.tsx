'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useState } from 'react'

interface ChoiceButtonsProps {
  options: { label: string; value: string }[]
  type: 'single_choice' | 'multi_choice'
  onSubmit: (value: string) => void,
  initialSelected?: string[]   // ← 
}

export function ChoiceButtons({ options, type, onSubmit ,initialSelected=[]}: ChoiceButtonsProps) {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (value: string) => {
    if (type === 'single_choice') {
      setSelected([value])
      setTimeout(() => onSubmit(value), 200)
    } else {
      setSelected((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      )
    }
  }

  const handleMultiSubmit = () => {
    if (selected.length > 0) {
      onSubmit(selected.join('، '))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => {
          const isSelected = selected.includes(opt.value)
          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggle(opt.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm 
                         font-medium border-2 transition-all duration-200
                         ${isSelected
                           ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900'
                           : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700'
                         }`}
            >
              {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
              {opt.label}
            </motion.button>
          )
        })}
      </div>

      {type === 'multi_choice' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: selected.length > 0 ? 1 : 0.5 }}
          onClick={handleMultiSubmit}
          disabled={selected.length === 0}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-sm"
        >
          تأكيد الاختيار ({selected.length})
        </motion.button>
      )}
    </motion.div>
  )
}