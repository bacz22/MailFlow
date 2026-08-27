import React from 'react'
import type { Permission } from './permissions'
import { usePermission } from './PermissionContext'
import { Tooltip } from '../components/ui/Tooltip'

export interface PermissionGateProps {
  /** Single required permission */
  permission?: Permission
  /** Render if user has ANY of these permissions */
  anyPermissions?: Permission[]
  /** Render only if user has ALL of these permissions */
  allPermissions?: Permission[]
  /** Optional fallback UI when permission is denied */
  fallback?: React.ReactNode
  /**
   * If true, instead of hiding the child, clones the child element with `disabled={true}`
   * and wraps it in a tooltip explaining the permission requirement.
   */
  renderDisabled?: boolean
  /** Tooltip message shown when renderDisabled is true */
  disabledTooltip?: string
  children: React.ReactNode
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  renderDisabled = false,
  disabledTooltip = 'Bạn không có quyền thực hiện thao tác này.',
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()

  let isAllowed = true

  if (permission) {
    isAllowed = hasPermission(permission)
  } else if (allPermissions && allPermissions.length > 0) {
    isAllowed = hasAllPermissions(allPermissions)
  } else if (anyPermissions && anyPermissions.length > 0) {
    isAllowed = hasAnyPermission(anyPermissions)
  }

  if (isAllowed) {
    return <>{children}</>
  }

  // If renderDisabled is requested and children is a valid React element
  if (renderDisabled && React.isValidElement(children)) {
    const disabledChild = React.cloneElement(children as React.ReactElement<any>, {
      disabled: true,
      className: `${(children.props as any).className || ''} opacity-50 cursor-not-allowed pointer-events-none`,
      title: undefined,
    })

    return (
      <Tooltip content={disabledTooltip} side="top">
        <span className="inline-block cursor-not-allowed">{disabledChild}</span>
      </Tooltip>
    )
  }

  return <>{fallback}</>
}

export default PermissionGate
