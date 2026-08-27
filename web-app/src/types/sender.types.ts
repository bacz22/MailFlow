export type SenderVerificationStatus = 'VERIFIED' | 'PENDING' | 'FAILED'

export interface VerifiedSender {
  id: string
  name: string
  email: string
  domain: string
  status?: SenderVerificationStatus
  isVerified: boolean
  isDefault?: boolean
  dkimStatus: 'verified' | 'pending' | 'failed'
  spfStatus: 'verified' | 'pending' | 'failed'
  createdAt?: string
  lastUsedAt?: string
}
