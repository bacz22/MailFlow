import type { WorkspaceRole } from '../permissions/roles'

export type MemberStatus = 'ACTIVE' | 'PENDING' | 'DISABLED'

export interface WorkspaceMember {
  id: string
  name: string
  email: string
  role: WorkspaceRole
  status: MemberStatus
  avatarUrl?: string
  joinedAt: string
  lastActiveAt: string
  isCurrentUser?: boolean
}
