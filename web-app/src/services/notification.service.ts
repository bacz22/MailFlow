import { apiClient } from './apiClient'
import type { NotificationPageResponse } from '../types/notification.types'

export interface GetNotificationsParams {
  page?: number
  size?: number
  unreadOnly?: boolean
}

export interface UnreadCountResponse {
  unreadCount: number
}

export const notificationService = {
  async getNotifications(
    workspaceId: string,
    params?: GetNotificationsParams
  ): Promise<NotificationPageResponse> {
    const searchParams = new URLSearchParams()
    if (params?.page !== undefined) searchParams.set('page', String(params.page))
    if (params?.size !== undefined) searchParams.set('size', String(params.size))
    if (params?.unreadOnly !== undefined) searchParams.set('unreadOnly', String(params.unreadOnly))

    const qs = searchParams.toString()
    const url = `/workspaces/${workspaceId}/notifications${qs ? `?${qs}` : ''}`
    return apiClient<NotificationPageResponse>(url, { method: 'GET' })
  },

  async getUnreadCount(workspaceId: string): Promise<number> {
    const res = await apiClient<UnreadCountResponse>(
      `/workspaces/${workspaceId}/notifications/unread-count`,
      { method: 'GET' }
    )
    return res.unreadCount
  },

  async markAsRead(workspaceId: string, id: string): Promise<void> {
    await apiClient<void>(`/workspaces/${workspaceId}/notifications/${id}/read`, {
      method: 'PATCH',
    })
  },

  async markAllAsRead(workspaceId: string): Promise<number> {
    const res = await apiClient<{ success: boolean; markedCount: number }>(
      `/workspaces/${workspaceId}/notifications/mark-all-read`,
      { method: 'POST' }
    )
    return res.markedCount
  },
}
