import React from 'react'
import { cn } from '../../utils/cn'
import { Tooltip } from '../ui/Tooltip'

export interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  href?: string
  active?: boolean
  badge?: string | number
  badgeVariant?: 'default' | 'primary' | 'warning' | 'danger' | 'success'
  collapsed?: boolean
  onClick?: () => void
  className?: string
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  active = false,
  badge,
  badgeVariant = 'primary',
  collapsed = false,
  onClick,
  className,
}) => {
  const content = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer select-none text-left focus:outline-none focus:ring-2 focus:ring-blue-500/30',
        active
          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70',
        collapsed && 'justify-center px-2 py-2.5',
        className
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span className={cn('w-4 h-4 shrink-0', active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400')}>
        {icon}
      </span>

      {!collapsed && (
        <>
          <span className="flex-1 truncate tracking-tight">{label}</span>
          {badge !== undefined && (
            <span
              className={cn(
                'text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 font-mono',
                badgeVariant === 'primary'
                  ? 'bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300'
                  : badgeVariant === 'danger'
                  ? 'bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300'
                  : badgeVariant === 'warning'
                  ? 'bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  )

  if (collapsed) {
    return (
      <Tooltip content={label} side="right" sideOffset={8}>
        {content}
      </Tooltip>
    )
  }

  return content
}

export default SidebarItem
