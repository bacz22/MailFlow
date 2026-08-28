import React, { useState, useEffect } from 'react'
import { cn } from '../../utils/cn'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { BreadcrumbItem } from '../ui/Breadcrumb'
import { Drawer, DrawerContent } from '../ui/Drawer'

export interface AppShellProps {
  currentPath?: string
  breadcrumbs?: BreadcrumbItem[]
  isDark?: boolean
  onToggleTheme?: () => void
  onNavigate?: (path: string) => void
  onLogout?: () => void
  children: React.ReactNode
  className?: string
}

export const AppShell: React.FC<AppShellProps> = ({
  currentPath = '/dashboard',
  breadcrumbs,
  isDark = true,
  onToggleTheme,
  onNavigate,
  onLogout,
  children,
  className,
}) => {
  // Desktop collapsed sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('mailflow_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  // Mobile drawer sidebar state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('mailflow_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  const handleNavigate = (path: string) => {
    onNavigate?.(path)
    setIsMobileDrawerOpen(false)
  }

  // Keyboard shortcut: ⌘B or Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleSidebarCollapse()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={cn('min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased', className)}>
      {/* 1. Desktop Fixed Sidebar (Hidden on screens < 1024px) */}
      <div className="hidden lg:block sticky top-0 h-screen shrink-0">
        <Sidebar
          currentPath={currentPath}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
        />
      </div>

      {/* 2. Mobile Drawer Sidebar (Shown on screens < 1024px) */}
      <Drawer open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
        <DrawerContent side="left" size="sm" className="p-0 max-w-72">
          <Sidebar
            currentPath={currentPath}
            collapsed={false}
            onNavigate={handleNavigate}
            onLogout={onLogout}
            isDark={isDark}
            onToggleTheme={onToggleTheme}
            className="border-r-0 w-full h-full"
          />
        </DrawerContent>
      </Drawer>

      {/* 3. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <Header
          breadcrumbs={breadcrumbs}
          onOpenMobileSidebar={() => setIsMobileDrawerOpen(true)}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onNavigate={handleNavigate}
          onLogout={onLogout}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
