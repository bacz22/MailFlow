import React from 'react'
import { Check } from 'lucide-react'
import { ROLE_CONFIGS } from './RoleBadge'
import type { WorkspaceRole } from '../../permissions/roles'

export interface RoleSelectorProps {
  selectedRole: WorkspaceRole
  onSelectRole: (role: WorkspaceRole) => void
  disabledRoles?: WorkspaceRole[]
  excludeOwner?: boolean
}

const SELECTABLE_ROLES: WorkspaceRole[] = [
  'ADMIN',
  'MARKETING_MANAGER',
  'CAMPAIGN_EDITOR',
  'CONTACT_MANAGER',
  'ANALYST',
  'BILLING_MANAGER',
  'VIEWER',
]

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onSelectRole,
  disabledRoles = [],
  excludeOwner = true,
}) => {
  const roles = excludeOwner ? SELECTABLE_ROLES : (['OWNER', ...SELECTABLE_ROLES] as WorkspaceRole[])

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {roles.map((r) => {
        const config = ROLE_CONFIGS[r]
        const isSelected = selectedRole === r
        const isDisabled = disabledRoles.includes(r)

        return (
          <div
            key={r}
            onClick={() => {
              if (!isDisabled) onSelectRole(r)
            }}
            className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 text-xs select-none ${
              isDisabled
                ? 'opacity-50 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                : isSelected
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20 cursor-pointer'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900 cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{config.icon}</div>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{config.label}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {config.description}
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RoleSelector
