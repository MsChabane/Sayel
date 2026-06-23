'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Sidebar } from '@/components/admin/Sidebar'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { ArrowRight, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { SubmissionDetail } from '@/lib/types'


export default function SubmissionDetailPage({id}:{id:string}) {
  
  const router = useRouter()
  const [data, setData] = useState<SubmissionDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSubmission(id)
      .then(setData)
      .catch(() => toast.error('فشل تحميل الاستبيان'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 
                     hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للقائمة
        </button>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent 
                            rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 
                            border border-gray-100 dark:border-gray-800 mb-6">
              <div className="flex flex-wrap items-center gap-4 justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    استبيان #{data.session.id}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">
                    {data.session.session_uuid}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                                   text-sm font-medium
                                   ${data.session.status === 'completed'
                                     ? 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
                                     : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400'
                                   }`}>
                    {data.session.status === 'completed'
                      ? <CheckCircle className="w-4 h-4" />
                      : <Clock className="w-4 h-4" />}
                    {data.session.status === 'completed' ? 'مكتمل' : 'غير مكتمل'}
                  </span>
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    {format(new Date(data.session.started_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                  </span>
                </div>
              </div>
            </div>

            {/* Q&A List — resembles a conversation */}
            <div className="space-y-4">
              {data.answers.map((qa, index) => (
                <div key={index}
                  className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden
                             border border-gray-100 dark:border-gray-800">
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 
                                  border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-blue-100 dark:bg-blue-900 rounded-lg 
                                       flex items-center justify-center text-xs font-bold 
                                       text-blue-600 dark:text-blue-400 flex-shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {qa.question_title}
                      </p>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-gray-800 dark:text-gray-100 leading-relaxed">
                      {qa.answer}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                      {format(new Date(qa.answered_at), 'HH:mm:ss', { locale: ar })}
                    </p>
                  </div>
                </div>
              ))}

              {data.answers.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  لا توجد إجابات مسجّلة
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}