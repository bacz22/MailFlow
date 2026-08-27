export type NotificationType =
  | 'CAMPAIGN_COMPLETED'
  | 'CAMPAIGN_FAILED'
  | 'CAMPAIGN_APPROVAL_REQUIRED'
  | 'CAMPAIGN_REJECTED'
  | 'IMPORT_COMPLETED'
  | 'IMPORT_FAILED'
  | 'DOMAIN_VERIFIED'
  | 'DOMAIN_VERIFICATION_FAILED'
  | 'USAGE_NEAR_LIMIT'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  description: string
  createdAt: string
  timeAgo: string
  isRead: boolean
  targetPath: string
  category: 'campaign' | 'audience' | 'system' | 'billing'
}
