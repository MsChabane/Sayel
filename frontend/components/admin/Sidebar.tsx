'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, HelpCircle, Inbox,
  Users, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

const navItems = [
  { href: '/admin/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/admin/questions', label: 'الأسئلة', icon: HelpCircle },
  { href: '/admin/submissions', label: 'الإجابات', icon: Inbox },
  { href: '/admin/users', label: 'المستخدمون', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      // Tell the backend to clear its HttpOnly cookies
      await api.adminLogOut()
    } catch {
      // Ignore errors — clear client state regardless
    } finally {               // clear localStorage
      toast.success('تم تسجيل الخروج')
      router.push('/admin/login')
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center 
                          justify-center text-white font-bold">
            ب
          </div>
          <span className="font-bold text-gray-800 dark:text-gray-100">
            لوحة الإدارة
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl 
                         text-sm font-medium transition-all duration-200
                         ${active
                           ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                           : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                         }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl
                     text-sm font-medium text-red-500 hover:bg-red-50 
                     dark:hover:bg-red-950 transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 
                        border-l border-gray-100 dark:border-gray-800 h-screen 
                        sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white 
                   dark:bg-gray-800 rounded-xl shadow-md border 
                   border-gray-100 dark:border-gray-700"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-white dark:bg-gray-900 
                            h-full shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 left-4"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}