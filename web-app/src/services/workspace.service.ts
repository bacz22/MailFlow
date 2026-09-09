import { apiClient, setAccessToken } from './apiClient'
import type {
  SwitchWorkspaceResponse,
  WorkspaceSettings,
  WorkspaceSummary,
} from '../types/workspace.types'
import type { WorkspaceMember } from '../types/member.types'
import type { WorkspaceRole } from '../permissions/roles'

function mapSummary(item: WorkspaceSummary): WorkspaceSummary {
  return {
    ...item,
    isCurrent: !!(item.isCurrent ?? item.current),
    plan: item.plan || 'Free',
    brandColor: item.brandColor || '#2563eb',
  }
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

export const workspaceService = {
  async list(): Promise<WorkspaceSummary[]> {
    const items = await apiClient<WorkspaceSummary[]>('/workspaces', { method: 'GET' })
    return items.map(mapSummary)
  },

  async create(name: string): Promise<WorkspaceSummary> {
    const created = await apiClient<WorkspaceSummary>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
    return mapSummary(created)
  },

  async switchWorkspace(
    workspaceId: string,
    options?: { skipRefresh?: boolean }
  ): Promise<SwitchWorkspaceResponse> {
    const res = await apiClient<SwitchWorkspaceResponse>(`/workspaces/${workspaceId}/switch`, {
      method: 'POST',
      skipRefresh: options?.skipRefresh,
    })
    setAccessToken(res.accessToken)
    return res
  },

  async getSettings(workspaceId: string): Promise<WorkspaceSettings> {
    return apiClient<WorkspaceSettings>(`/workspaces/${workspaceId}`, { method: 'GET' })
  },

  async updateSettings(workspaceId: string, payload: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
    return apiClient<WorkspaceSettings>(`/workspaces/${workspaceId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  async uploadLogo(workspaceId: string, file: File): Promise<WorkspaceSettings> {
    const form = new FormData()
    form.append('file', file)
    return apiClient<WorkspaceSettings>(`/workspaces/${workspaceId}/logo`, {
      method: 'POST',
      body: form,
    })
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await apiClient<void>(`/workspaces/${workspaceId}`, { method: 'DELETE' })
  },

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const rows = await apiClient<Array<WorkspaceMember & { currentUser?: boolean; joinedAt: string; lastActiveAt?: string }>>(
      `/workspaces/${workspaceId}/members`,
      { method: 'GET' }
    )
    return rows.map((row) => ({
      ...row,
      isCurrentUser: !!(row.isCurrentUser ?? row.currentUser),
      joinedAt: formatDate(row.joinedAt),
      lastActiveAt: row.status === 'PENDING' ? 'Chờ chấp nhận' : formatDate(row.lastActiveAt),
    }))
  },

  async updateMemberRole(workspaceId: string, memberId: string, role: WorkspaceRole): Promise<void> {
    await apiClient(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
  },

  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    await apiClient<void>(`/workspaces/${workspaceId}/members/${memberId}`, { method: 'DELETE' })
  },

  async inviteMember(workspaceId: string, email: string, role: WorkspaceRole): Promise<{ message: string }> {
    return apiClient(`/workspaces/${workspaceId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    })
  },

  async cancelInvitation(workspaceId: string, invitationId: string): Promise<void> {
    await apiClient<void>(`/workspaces/${workspaceId}/invitations/${invitationId}`, { method: 'DELETE' })
  },

  async acceptInvitation(token: string): Promise<SwitchWorkspaceResponse> {
    const res = await apiClient<SwitchWorkspaceResponse>('/workspace-invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
    setAccessToken(res.accessToken)
    return res
  },
}
