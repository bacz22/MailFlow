import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { Permission } from './permissions'
import { ROLES, ROLES_METADATA } from './roles'
import type { WorkspaceRole, RoleMetadata } from './roles'
import { ROLE_PERMISSIONS, ROUTE_REQUIRED_PERMISSIONS } from './role-permissions'

export interface PermissionContextValue {
  currentRole: WorkspaceRole
  roleMetadata: RoleMetadata
  permissions: Permission[]
  hasPermission: (permission: Permission) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  canAccessRoute: (routePath: string) => boolean
  switchRole: (role: WorkspaceRole) => void
}

const PermissionContext = createContext<PermissionContextValue | null>(null)

export interface PermissionProviderProps {
  initialRole?: WorkspaceRole
  children: React.ReactNode
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({
  initialRole = ROLES.VIEWER,
  children,
}) => {
  const [currentRole, setCurrentRole] = useState<WorkspaceRole>(initialRole)

  const switchRole = useCallback((role: WorkspaceRole) => {
    setCurrentRole(role)
  }, [])

  const roleMetadata = useMemo(() => ROLES_METADATA[currentRole], [currentRole])
  const permissions = useMemo(() => ROLE_PERMISSIONS[currentRole] || [], [currentRole])
  const permissionSet = useMemo(() => new Set(permissions), [permissions])

  const hasPermission = useCallback(
    (permission: Permission): boolean => permissionSet.has(permission),
    [permissionSet]
  )

  const hasAllPermissions = useCallback(
    (perms: Permission[]): boolean => perms.every((p) => permissionSet.has(p)),
    [permissionSet]
  )

  const hasAnyPermission = useCallback(
    (perms: Permission[]): boolean => perms.some((p) => permissionSet.has(p)),
    [permissionSet]
  )

  const canAccessRoute = useCallback(
    (routePath: string): boolean => {
      const requiredPermission = ROUTE_REQUIRED_PERMISSIONS[routePath]
      if (!requiredPermission) return true
      return permissionSet.has(requiredPermission)
    },
    [permissionSet]
  )

  const value: PermissionContextValue = useMemo(
    () => ({
      currentRole,
      roleMetadata,
      permissions,
      hasPermission,
      hasAllPermissions,
      hasAnyPermission,
      canAccessRoute,
      switchRole,
    }),
    [
      currentRole,
      roleMetadata,
      permissions,
      hasPermission,
      hasAllPermissions,
      hasAnyPermission,
      canAccessRoute,
      switchRole,
    ]
  )

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function usePermission(): PermissionContextValue {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermission must be used within a <PermissionProvider>')
  }
  return context
}

export default PermissionContext
