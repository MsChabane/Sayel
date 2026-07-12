'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'

const loginSchema = z.object({
  email:    z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
})

type LoginForm = z.infer<typeof loginSchema>

const REASON_MESSAGES: Record<string, string> = {
  expired:       'انتهت صلاحية جلستك. يرجى تسجيل الدخول مجدداً.',
  invalid_token: 'رمز المصادقة غير صالح. يرجى تسجيل الدخول مجدداً.',
  server_error:  'تعذّر التحقق من هويتك. يرجى المحاولة مجدداً.',
}

// ── Inner form ─────────────────────────────────────────────────────────────────

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const from   = searchParams.get('from')   || '/admin/dashboard'
  const reason = searchParams.get('reason') || ''

  // ── Guard against double-fire in React 18 Strict Mode ─────────────────────
  // useRef persists across re-renders without causing re-renders itself,
  // and is NOT reset between Strict Mode's double-invocation cycles
  // the way useState is. So it reliably fires only once.
  const toastShown    = useRef(false)
  const redirectCheck = useRef(false)

  // Show reason toast exactly once
  useEffect(() => {
    if (toastShown.current)    return
    if (!reason)               return
    if (!REASON_MESSAGES[reason]) return

    toastShown.current = true
    // Small delay so the page is visible before the toast appears
    const timer = setTimeout(() => {
      toast.warning(REASON_MESSAGES[reason])
    }, 100)

    return () => clearTimeout(timer)
  }, [reason])


  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const res = await api.adminLogin(data.email, data.password)
      console.log("res",res)
      // Backend already set HttpOnly cookies.
      // Store access token in localStorage for Authorization headers.
     

      toast.success(`مرحباً، ${res.admin.name}!`)
      router.replace(from)
    } catch (err: any) {
      toast.error(err.message || 'بيانات الدخول غير صحيحة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

      {/* Access-required notice (only when redirected without a specific reason) */}
      {from !== '/admin/dashboard' && !reason && (
        <div className="flex items-center gap-2 px-4 py-3
                        bg-blue-50 dark:bg-blue-950
                        border border-blue-200 dark:border-blue-800
                        rounded-xl text-sm text-blue-700 dark:text-blue-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          يجب تسجيل الدخول للوصول إلى هذه الصفحة
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700
                          dark:text-gray-300 mb-2">
          البريد الإلكتروني
        </label>
        <input
          {...register('email')}
          type="email"
          placeholder="admin@example.com"
          autoComplete="email"
          className="w-full px-4 py-3 rounded-xl border border-gray-200
                     dark:border-gray-700 bg-gray-50 dark:bg-gray-800
                     text-gray-800 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     transition-all text-sm"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700
                          dark:text-gray-300 mb-2">
          كلمة المرور
        </label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200
                       dark:border-gray-700 bg-gray-50 dark:bg-gray-800
                       text-gray-800 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       transition-all text-sm pl-12"
          />
          <button
            type="button"
            onClick={() => setShowPwd((p) => !p)}
            className="absolute left-3 top-1/2 -translate-y-1/2
                       text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPwd
              ? <EyeOff className="w-5 h-5" />
              : <Eye    className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3
                   bg-blue-600 text-white rounded-xl font-medium
                   hover:bg-blue-700 active:bg-blue-800
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent
                          rounded-full animate-spin" />
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            تسجيل الدخول
          </>
        )}
      </button>
    </form>
  )
}

// ── Page shell ─────────────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center
                          justify-center text-white text-2xl font-bold
                          mx-auto mb-4 shadow-lg shadow-blue-200 dark:shadow-blue-900">
            ب
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            لوحة الإدارة
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            سجّل دخولك للمتابعة
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm
                        border border-gray-100 dark:border-gray-800 p-8">
          {/*
            Suspense is required here because LoginForm uses useSearchParams().
            Without it Next.js throws during static rendering.
          */}
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600
                              border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
