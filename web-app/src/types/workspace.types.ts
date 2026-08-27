export interface WorkspaceSettings {
  id: string
  name: string
  slug: string
  logoUrl?: string
  displayName: string
  brandColor: string
  timezone: string
  defaultSenderId: string
  enableOpenTracking: boolean
  enableClickTracking: boolean
  enforceRfc8058: boolean
  industry: string
}
