import * as React from 'react'
import { cn } from '../../utils/cn'

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  density?: 'compact' | 'comfortable'
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, density = 'compact', ...props }, ref) => (
    <div className="relative w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn(
          'w-full caption-bottom text-xs text-left',
          density === 'compact' && '[&_tr]:h-10',
          density === 'comfortable' && '[&_tr]:h-13',
          className
        )}
        {...props}
      />
    </div>
  )
)
Table.displayName = 'Table'

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider sticky top-0 z-10',
      className
    )}
    {...props}
  />
))
TableHeader.displayName = 'TableHeader'

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-medium', className)}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    selected?: boolean
  }
>(({ className, selected = false, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 data-[state=selected]:bg-blue-50/50 dark:data-[state=selected]:bg-blue-950/30',
      selected && 'bg-blue-50/50 dark:bg-blue-950/30',
      className
    )}
    data-state={selected ? 'selected' : undefined}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    stickyRight?: boolean
  }
>(({ className, stickyRight, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'py-2 px-4 text-left align-middle font-semibold select-none',
      stickyRight && 'sticky right-0 bg-slate-50 dark:bg-slate-800/95 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    stickyRight?: boolean
  }
>(({ className, stickyRight, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'py-2 px-4 align-middle',
      stickyRight && 'sticky right-0 bg-white/95 dark:bg-slate-900/95 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]',
      className
    )}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-xs text-slate-500 dark:text-slate-400', className)}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'
