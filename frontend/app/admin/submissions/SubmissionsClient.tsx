'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api  } from '@/lib/api'
import { Sidebar } from '@/components/admin/Sidebar'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  CheckCircle, Clock, XCircle,
  ExternalLink, Sheet
} from 'lucide-react'
import { toast } from 'sonner'
import { Submission } from '@/lib/types'


const statusConfig = {
  completed: { label: 'مكتمل', icon: CheckCircle, className: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400' },
  active: { label: 'جاري', icon: Clock, className: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400' },
  abandoned: { label: 'متروك', icon: XCircle, className: 'text-red-500 bg-red-50 dark:bg-red-950 dark:text-red-400' },
}

export default function SubmissionsPage() {
 

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSubmissions()
      .then(setSubmissions)
      .catch(() => toast.error('فشل تحميل الإجابات'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8">
          الاستبيانات المُرسَلة
        </h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent 
                            rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border 
                          border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['معرف الجلسة', 'التاريخ', 'الحالة', 'الإجابات', 'Google Sheets', 'تفاصيل'].map(h => (
                      <th key={h} className="text-right text-xs font-semibold text-gray-500 
                                              dark:text-gray-400 px-6 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {submissions.map((s) => {
                    const status = statusConfig[s.status as keyof typeof statusConfig]
                    const StatusIcon = status.icon
                    return (
                      <tr key={s.session_id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                            {s.session_uuid.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(s.started_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 
                                           rounded-full text-xs font-medium ${status.className}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {s.answer_count} إجابة
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full
                            ${s.sheets_synced
                              ? 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
                              : 'bg-gray-50 text-gray-400 dark:bg-gray-800'
                            }`}>
                            {s.sheets_synced ? '✓ متزامن' : 'غير متزامن'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/admin/submissions/${s.session_uuid}`}
                            className="flex items-center gap-1 text-blue-600 
                                       dark:text-blue-400 hover:text-blue-700 text-sm">
                            عرض
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {submissions.length === 0 && (
                <div className="text-center py-20 text-gray-400 dark:text-gray-600">
                  <p>لا توجد استبيانات بعد</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}