import * as React from 'react'
import { ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

export interface BreadcrumbProps extends React.ComponentPropsWithoutRef<'nav'> {
  items?: BreadcrumbItem[]
  separator?: React.ReactNode
  children?: React.ReactNode
  onNavigate?: (path: string) => void
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
  children,
  className,
  onNavigate,
  ...props
}) => {
  if (children) {
    return (
      <nav aria-label="breadcrumb" className={cn('flex items-center text-xs sm:text-sm', className)} {...props}>
        <ol className="flex items-center gap-1.5 flex-wrap text-slate-500 dark:text-slate-400">{children}</ol>
      </nav>
    )
  }

  if (!items || items.length === 0) return null

  return (
    <nav aria-label="breadcrumb" className={cn('flex items-center text-xs sm:text-sm', className)} {...props}>
      <ol className="flex items-center gap-1.5 flex-wrap text-slate-500 dark:text-slate-400">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <React.Fragment key={idx}>
              <li className="inline-flex items-center gap-1">
                {item.href && !isLast ? (
                  <a
                    href={item.href}
                    onClick={(e) => {
                      if (onNavigate && item.href && item.href !== '#') {
                        e.preventDefault()
                        onNavigate(item.href)
                      }
                    }}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1',
                      isLast
                        ? 'font-semibold text-slate-900 dark:text-slate-100'
                        : 'text-slate-500 dark:text-slate-400'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
              {!isLast && <li aria-hidden="true" className="flex items-center">{separator}</li>}
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

export const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn('flex h-5 w-5 items-center justify-center text-slate-400', className)}
    {...props}
  >
    <MoreHorizontal className="h-3.5 w-3.5" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis'
