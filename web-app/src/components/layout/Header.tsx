import React from 'react'
import {
  Menu,
  Search,
  Moon,
  Sun,
  Plus,
  Command,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { Breadcrumb } from '../ui/Breadcrumb'
import type { BreadcrumbItem } from '../ui/Breadcrumb'
import { NotificationBellDropdown } from '../notifications/NotificationBellDropdown'
import { UserMenu } from './UserMenu'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'
import { useToast } from '../ui/Toast'

export interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[]
  onOpenMobileSidebar?: () => void
  isDark?: boolean
  onToggleTheme?: () => void
  onNavigate?: (path: string) => void
  onLogout?: () => void
  onQuickSearchClick?: () => void
  onCreateClick?: () => void
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
  onQuickSearchClick,
  onCreateClick,
  className,
}) => {
  const { showToast } = useToast()

  const handleQuickSearch = () => {
    if (onQuickSearchClick) {
      onQuickSearchClick()
    } else {
      showToast({
        type: 'info',
        title: 'Tìm kiếm nhanh (⌘K)',
        description: 'Mở Command Palette tìm kiếm liên hệ, chiến dịch và hành động.',
      })
    }
  }

  const handleCreate = () => {
    if (onCreateClick) {
      onCreateClick()
    } else {
      showToast({
        type: 'info',
        title: 'Tạo Mới',
        description: 'Mở trình khởi tạo chiến dịch hoặc import danh bạ.',
      })
    }
  }

  return (
    <header
      className={cn(
        'h-14 px-4 sm:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-20 select-none',
        className
      )}
    >
      {/* Left Area: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          aria-label="Mở menu điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden sm:block truncate">
          <Breadcrumb items={breadcrumbs} />
        </div>
      </div>

      {/* Right Area: Search trigger, Quick actions, Notifications, Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Search Button (⌘K) */}
        <button
          type="button"
          onClick={handleQuickSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          title="Tìm kiếm (Ctrl+K / ⌘K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline font-medium">Tìm kiếm nhanh...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Quick Create Action */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={handleCreate}
          className="hidden sm:inline-flex text-xs h-8 px-3"
        >
          Tạo Mới
        </Button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Theme Toggle Button */}
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

        {/* Notifications Dropdown */}
        <NotificationBellDropdown onNavigate={onNavigate || (() => {})} />

        {/* User Menu on mobile / header */}
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
