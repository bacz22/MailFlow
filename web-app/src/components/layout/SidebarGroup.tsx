import React from 'react'
import { cn } from '../../utils/cn'

export interface SidebarGroupProps {
  label?: string
  collapsed?: boolean
  children: React.ReactNode
  className?: string
}

export const SidebarGroup: React.FC<SidebarGroupProps> = ({
  label,
  collapsed = false,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-1', className)}>
      {label && !collapsed && (
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
          {label}
        </div>
      )}

      {label && collapsed && (
        <div className="my-2 mx-auto w-6 h-px bg-slate-200 dark:bg-slate-800" />
      )}

      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

export default SidebarGroup
