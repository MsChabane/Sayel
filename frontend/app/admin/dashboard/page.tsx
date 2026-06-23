'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Sidebar } from '@/components/admin/Sidebar'
import { StatsCard } from '@/components/admin/StatsCard'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  HelpCircle, Users, CheckCircle,
  XCircle, TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardStats } from '@/lib/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDashboard()
      .then(setStats)
      .catch(() => toast.error('فشل تحميل الإحصائيات'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent 
                          rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8">
          لوحة التحكم
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          <StatsCard title="إجمالي الأسئلة" value={stats.total_questions}
            icon={HelpCircle} color="blue" index={0} />
          <StatsCard title="إجمالي الجلسات" value={stats.total_sessions}
            icon={Users} color="purple" index={1} />
          <StatsCard title="استبيانات مكتملة" value={stats.completed_sessions}
            icon={CheckCircle} color="green" index={2} />
          <StatsCard title="جلسات متروكة" value={stats.abandoned_sessions}
            icon={XCircle} color="red" index={3} />
          <StatsCard title="معدل الإكمال" value={`${stats.completion_rate}%`}
            icon={TrendingUp} color="orange" index={4} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 
                          border border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4">
              الاستبيانات اليومية (آخر 14 يوم)
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.daily_submissions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fontFamily: 'Cairo' }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontFamily: 'Cairo', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  labelFormatter={(v) => `التاريخ: ${v}`}
                  formatter={(v) => [`${v} استبيان`, 'العدد']}
                />
                <Line
                  type="monotone" dataKey="count"
                  stroke="#3b82f6" strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 
                          border border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4">
              الاستبيانات الأسبوعية (آخر 8 أسابيع)
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.weekly_submissions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fontFamily: 'Cairo' }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontFamily: 'Cairo', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v) => [`${v} استبيان`, 'العدد']}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  )
}