import React, { createContext, useContext, useState, useMemo } from 'react'
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
  initialRole = ROLES.MARKETING_MANAGER,
  children,
}) => {
  const [currentRole, setCurrentRole] = useState<WorkspaceRole>(() => {
    try {
      const saved = localStorage.getItem('mailflow_active_role') as WorkspaceRole
      if (saved && saved in ROLES) return saved
    } catch {}
    return initialRole
  })

  const switchRole = (role: WorkspaceRole) => {
    setCurrentRole(role)
    try {
      localStorage.setItem('mailflow_active_role', role)
    } catch {}
  }

  const roleMetadata = useMemo(() => ROLES_METADATA[currentRole], [currentRole])
  const permissions = useMemo(() => ROLE_PERMISSIONS[currentRole] || [], [currentRole])
  const permissionSet = useMemo(() => new Set(permissions), [permissions])

  const hasPermission = (permission: Permission): boolean => {
    return permissionSet.has(permission)
  }

  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every((p) => permissionSet.has(p))
  }

  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some((p) => permissionSet.has(p))
  }

  const canAccessRoute = (routePath: string): boolean => {
    const requiredPermission = ROUTE_REQUIRED_PERMISSIONS[routePath]
    if (!requiredPermission) return true // Unprotected / public route
    return permissionSet.has(requiredPermission)
  }

  const value: PermissionContextValue = {
    currentRole,
    roleMetadata,
    permissions,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    canAccessRoute,
    switchRole,
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermission(): PermissionContextValue {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermission must be used within a <PermissionProvider>')
  }
  return context
}

export default PermissionContext
