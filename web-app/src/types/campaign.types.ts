export type CampaignStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'QUEUED'
  | 'SENDING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REJECTED'

export interface Campaign {
  id: string
  name: string
  subject: string
  status: CampaignStatus
  audienceName: string
  audienceType: 'list' | 'segment'
  recipientCount: number
  sentCount: number
  openRate: number // percentage e.g. 48.2
  clickRate: number // percentage e.g. 12.6
  bounceRate?: number
  scheduledAt?: string
  sentAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}
