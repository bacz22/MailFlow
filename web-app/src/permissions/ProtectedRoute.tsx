import React from 'react'
import type { Permission } from './permissions'
import { usePermission } from './PermissionContext'
import { ROUTE_REQUIRED_PERMISSIONS } from './role-permissions'
import { UnauthorizedPage } from '../views/UnauthorizedPage'

export interface ProtectedRouteProps {
  path: string
  permission?: Permission
  onNavigateHome?: () => void
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  path,
  permission,
  onNavigateHome,
  children,
}) => {
  const { canAccessRoute, hasPermission } = usePermission()

  const requiredPermission = permission || ROUTE_REQUIRED_PERMISSIONS[path]
  const isAllowed = permission ? hasPermission(permission) : canAccessRoute(path)

  if (!isAllowed) {
    return (
      <UnauthorizedPage
        attemptedPath={path}
        requiredPermission={requiredPermission}
        onNavigateHome={onNavigateHome}
      />
    )
  }

  return <>{children}</>
}

export default ProtectedRoute
