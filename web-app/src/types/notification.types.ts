export type NotificationType =
  | 'CAMPAIGN_COMPLETED'
  | 'CAMPAIGN_FAILED'
  | 'CAMPAIGN_APPROVAL_REQUESTED'
  | 'CAMPAIGN_APPROVAL_REQUIRED'
  | 'CAMPAIGN_APPROVED'
  | 'CAMPAIGN_REJECTED'
  | 'CONTACT_IMPORT_COMPLETED'
  | 'CONTACT_IMPORT_FAILED'
  | 'IMPORT_COMPLETED'
  | 'IMPORT_FAILED'
  | 'QUOTA_EXCEEDED'
  | 'DOMAIN_VERIFIED'
  | 'DOMAIN_VERIFICATION_FAILED'
  | 'USAGE_NEAR_LIMIT'
  | 'MEMBER_INVITED'
  | 'MEMBER_JOINED'
  | 'MEMBER_ROLE_UPDATED'
  | 'MEMBER_REMOVED'
  | 'SYSTEM_ALERT'

export interface BackendNotification {
  id: string
  workspaceId: string
  userId?: string | null
  type: NotificationType
  title: string
  message: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

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

export interface NotificationPageResponse {
  content: BackendNotification[]
  totalElements: number
  totalPages: number
  pageable?: {
    pageNumber: number
    pageSize: number
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return 'Vừa xong'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} phút trước`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} giờ trước`
    const diffDays = Math.floor(diffHour / 24)
    if (diffDays < 30) return `${diffDays} ngày trước`
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return 'Vừa xong'
  }
}

export function mapCategory(type: NotificationType): 'campaign' | 'audience' | 'system' | 'billing' {
  if (type.startsWith('CAMPAIGN_')) return 'campaign'
  if (type.includes('CONTACT_') || type.includes('IMPORT_')) return 'audience'
  if (type.includes('QUOTA_') || type.includes('USAGE_')) return 'billing'
  return 'system'
}

export function toAppNotification(raw: BackendNotification): AppNotification {
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    description: raw.message,
    createdAt: raw.createdAt,
    timeAgo: formatRelativeTime(raw.createdAt),
    isRead: raw.isRead,
    targetPath: raw.link || '',
    category: mapCategory(raw.type),
  }
}
