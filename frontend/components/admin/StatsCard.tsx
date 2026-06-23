'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  index?: number
}

const colorMap = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-950',   icon: 'text-blue-600 dark:text-blue-400',   text: 'text-blue-600' },
  green:  { bg: 'bg-green-50 dark:bg-green-950',  icon: 'text-green-600 dark:text-green-400', text: 'text-green-600' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950',icon: 'text-orange-600 dark:text-orange-400',text: 'text-orange-600' },
  red:    { bg: 'bg-red-50 dark:bg-red-950',      icon: 'text-red-600 dark:text-red-400',     text: 'text-red-600' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950',icon: 'text-purple-600 dark:text-purple-400',text: 'text-purple-600' },
}

export function StatsCard({ title, value, subtitle, icon: Icon, color, index = 0 }: StatsCardProps) {
  const colors = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-900 rounded-2xl p-6 
                 border border-gray-100 dark:border-gray-800 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
    </motion.div>
  )
}