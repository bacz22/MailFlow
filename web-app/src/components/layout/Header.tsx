import React from 'react'
import {
  Menu,
  Moon,
  Sun,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { Breadcrumb } from '../ui/Breadcrumb'
import type { BreadcrumbItem } from '../ui/Breadcrumb'
import { NotificationBellDropdown } from '../notifications/NotificationBellDropdown'
import { UserMenu } from './UserMenu'
import { Tooltip } from '../ui/Tooltip'

export interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[]
  onOpenMobileSidebar?: () => void
  isDark?: boolean
  onToggleTheme?: () => void
  onNavigate?: (path: string) => void
  onLogout?: () => void
  className?: string
}

export const Header: React.FC<HeaderProps> = ({
  breadcrumbs = [
    { label: 'MailFlow', href: '#' },
    { label: 'Dashboard' },
  ],
  onOpenMobileSidebar,
  isDark = true,
  onToggleTheme,
  onNavigate,
  onLogout,
  className,
}) => {
  return (
    <header
      className={cn(
        'h-14 px-4 sm:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-20 select-none',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          aria-label="Mở menu điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block truncate">
          <Breadcrumb items={breadcrumbs} />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Search / Tạo Mới — ẩn (mock / chưa dùng) */}

        {onToggleTheme && (
          <Tooltip content={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}>
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label="Chuyển đổi giao diện"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </Tooltip>
        )}

        <NotificationBellDropdown onNavigate={onNavigate || (() => {})} />

        <div className="lg:hidden">
          <UserMenu
            collapsed={true}
            isDark={isDark}
            onToggleTheme={onToggleTheme}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  )
}

export default Header
