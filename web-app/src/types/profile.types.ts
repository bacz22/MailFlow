export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  jobTitle: string
  avatarUrl?: string
  isEmailVerified: boolean
  twoFactorEnabled: boolean
  oauthAccounts: {
    provider: 'google' | 'github' | 'microsoft'
    connected: boolean
    email?: string
  }[]
}

export interface UserSession {
  id: string
  device: string
  browser: string
  os: string
  location: string
  ipAddress: string
  lastActive: string
  isCurrent: boolean
}
