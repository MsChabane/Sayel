'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Sidebar } from '@/components/admin/Sidebar'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Plus, Trash2, Shield, User, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { AdminCreate, AdminUser } from '@/lib/types'


const userSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  is_super_admin: z.boolean(),
})

type UserForm = z.infer<typeof userSchema>

export default function UsersPage() {


  const [users, setUsers] = useState<AdminUser[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { is_super_admin: false },
  })

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers()
      setUsers(data)
    } catch (err: any) {
      // Might 403 if not super admin
      if (!err.message?.includes('403')) toast.error('فشل تحميل المستخدمين')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const onSubmit = async (data: UserForm) => {
    try {
      await api.createUser(data as AdminCreate)
      toast.success('تم إضافة المستخدم')
      setShowForm(false)
      reset()
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد تعطيل هذا المستخدم؟')) return
    try {
      await api.deleteUser(id)
      toast.success('تم تعطيل المستخدم')
      fetchUsers()
    } catch {
      toast.error('فشل تعطيل المستخدم')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            إدارة المستخدمين
          </h1>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white 
                       rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            إضافة مستخدم
          </button>
        </div>

        {/* Add User Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b 
                              border-gray-100 dark:border-gray-800">
                <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                  إضافة مستخدم جديد
                </h2>
                <button onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {[
                  { name: 'name', label: 'الاسم الكامل', type: 'text', placeholder: 'محمد أحمد' },
                  { name: 'email', label: 'البريد الإلكتروني', type: 'email', placeholder: 'user@example.com' },
                  { name: 'password', label: 'كلمة المرور', type: 'password', placeholder: '••••••••' },
                ].map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 
                                      dark:text-gray-300 mb-2">{field.label}</label>
                    <input {...register(field.name as any)} type={field.type}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 
                                 dark:border-gray-700 bg-gray-50 dark:bg-gray-800
                                 text-gray-800 dark:text-gray-100
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    {errors[field.name as keyof typeof errors] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[field.name as keyof typeof errors]?.message as string}
                      </p>
                    )}
                  </div>
                ))}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input {...register('is_super_admin')} type="checkbox"
                    className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    صلاحيات مدير رئيسي (Super Admin)
                  </span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button type="submit"
                    className="flex-1 flex items-center justify-center gap-2 py-3 
                               bg-blue-600 text-white rounded-xl font-medium
                               hover:bg-blue-700 transition-colors">
                    <Check className="w-4 h-4" />
                    إضافة المستخدم
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-6 py-3 border border-gray-200 dark:border-gray-700 
                               rounded-xl text-gray-600 dark:text-gray-400
                               hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent 
                            rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border 
                          border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {users.map((user) => (
                <div key={user.id}
                  className="flex items-center gap-4 px-6 py-4 
                             hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                   ${user.is_super_admin
                                     ? 'bg-purple-100 dark:bg-purple-950'
                                     : 'bg-blue-100 dark:bg-blue-950'}`}>
                    {user.is_super_admin
                      ? <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      : <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {user.name}
                      </span>
                      {user.is_super_admin && (
                        <span className="text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-950 
                                         text-purple-600 dark:text-purple-400 rounded-full">
                          Super Admin
                        </span>
                      )}
                      {!user.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-950 
                                         text-red-500 rounded-full">
                          معطّل
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500 hidden sm:block">
                    {format(new Date(user.created_at), 'dd MMM yyyy', { locale: ar })}
                  </div>
                  <button onClick={() => handleDelete(user.id)}
                    className="p-2 text-gray-400 hover:text-red-600 
                               hover:bg-red-50 dark:hover:bg-red-950 
                               rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {users.length === 0 && (
                <div className="text-center py-20 text-gray-400 dark:text-gray-600">
                  لا يوجد مستخدمون
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}