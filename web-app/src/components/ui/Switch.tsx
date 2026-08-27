import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '../../utils/cn'

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  label?: string
  description?: string
}

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, label, description, id, ...props }, ref) => {
  const generatedId = React.useId()
  const switchId = id || (label ? `sw-${generatedId}` : undefined)

  const switchNode = (
    <SwitchPrimitives.Root
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700',
        className
      )}
      {...props}
      id={switchId}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitives.Root>
  )

  if (!label && !description) {
    return switchNode
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="grid gap-0.5 leading-none">
        {label && (
          <label
            htmlFor={switchId}
            className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 select-none">{description}</p>
        )}
      </div>
      {switchNode}
    </div>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName
