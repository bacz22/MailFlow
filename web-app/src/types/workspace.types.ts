export interface WorkspaceSettings {
  id: string
  name: string
  slug: string
  logoUrl?: string
  displayName: string
  brandColor: string
  timezone: string
  defaultSenderId?: string
  enableOpenTracking: boolean
  enableClickTracking: boolean
  enforceRfc8058: boolean
  industry: string
}

export interface WorkspaceSummary {
  id: string
  name: string
  logoUrl?: string
  plan: 'Free' | 'Starter' | 'Pro' | 'Enterprise'
  role: string
  isCurrent?: boolean
  current?: boolean
}

export interface SwitchWorkspaceResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  workspaceId: string
  workspaceName: string
  role: string
}
