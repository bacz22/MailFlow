import React, { useState, useEffect } from 'react'
import { Mail, ShieldCheck, Sun, Moon } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  className,
}) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mailflow_theme') === 'dark'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('mailflow_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('mailflow_theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => setIsDark(!isDark)

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Brand Bar */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-5xl mx-auto w-full">
        <a
          href="/login"
          className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded-xl"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-50">
              MailFlow
            </div>
            <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase -mt-0.5">
              Enterprise Email Platform
            </div>
          </div>
        </a>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>ISO 27001 & RFC 8058</span>
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            title={isDark ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)'}
            aria-label="Đổi theme sáng tối"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Main Center Area: Perfectly Centered Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className={cn('w-full max-w-md mx-auto', className)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 dark:shadow-black/40 space-y-6">
            {/* Header Title & Subtitle */}
            <div className="space-y-1.5 text-center sm:text-left">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Form Content */}
            <div>{children}</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© 2026 MailFlow Inc. All rights reserved.</div>
          <div className="flex items-center gap-4 text-xs">
            <a href="#" className="hover:underline">Điều khoản dịch vụ</a>
            <span>•</span>
            <a href="#" className="hover:underline">Chính sách bảo mật</a>
            <span>•</span>
            <a href="#" className="hover:underline">Hỗ trợ kỹ thuật</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AuthLayout
