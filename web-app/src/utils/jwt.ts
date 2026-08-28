import { ROLES } from '../permissions/roles'
import type { WorkspaceRole } from '../permissions/roles'

export function decodeJwtPayload(token: string | null): Record<string, unknown> | null {
  if (!token) {
    return null
  }
  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

export function workspaceRoleFromAccessToken(token: string | null): WorkspaceRole {
  const payload = decodeJwtPayload(token)
  if (!payload) {
    return ROLES.VIEWER
  }
  const raw = payload.roles
  const role = Array.isArray(raw) ? raw[0] : raw
  if (typeof role === 'string' && role in ROLES) {
    return role as WorkspaceRole
  }
  return ROLES.VIEWER
}
