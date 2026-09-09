import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { AppNotification, BackendNotification } from '../types/notification.types'
import { toAppNotification } from '../types/notification.types'
import { notificationService } from '../services/notification.service'
import { webSocketService } from '../services/websocket.service'
import { useWorkspace } from './WorkspaceContext'
import { useAuth } from './AuthContext'
import { useToast } from '../components/ui/Toast'

interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  hasNewNotification: boolean
  clearNewNotificationFlag: () => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
  deleteNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentWorkspaceId } = useWorkspace()
  const { user } = useAuth()
  const isAuthenticated = !!user
  const { showToast } = useToast()

  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [hasNewNotification, setHasNewNotification] = useState<boolean>(false)

  // Fetch initial / sync notifications from REST API
  const syncFromApi = useCallback(async (wsId: string) => {
    try {
      setLoading(true)
      const [count, pageRes] = await Promise.all([
        notificationService.getUnreadCount(wsId),
        notificationService.getNotifications(wsId, { page: 0, size: 20 }),
      ])
      setUnreadCount(count)
      setNotifications(pageRes.content.map(toAppNotification))
    } catch (err) {
      console.error('Failed to load notifications from REST API', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshNotifications = useCallback(async () => {
    if (currentWorkspaceId && isAuthenticated) {
      await syncFromApi(currentWorkspaceId)
    }
  }, [currentWorkspaceId, isAuthenticated, syncFromApi])

  // Setup WebSocket connection and subscriptions
  useEffect(() => {
    if (!isAuthenticated || !currentWorkspaceId) {
      webSocketService.disconnect()
      setNotifications([])
      setUnreadCount(0)
      return
    }

    // 1. Initial REST fetch
    void syncFromApi(currentWorkspaceId)

    // 2. Connect WebSocket
    webSocketService.connect()

    // 3. Handle Reconnect Gap: When STOMP onConnect fires (including auto-reconnect), re-sync DB
    const unsubscribeOnConnect = webSocketService.addOnConnectListener(() => {
      void syncFromApi(currentWorkspaceId)
    })

    // 4. Subscribe to Workspace broadcast topic
    const wsTopic = `/topic/workspaces/${currentWorkspaceId}/notifications`
    const unsubscribeWs = webSocketService.subscribe<BackendNotification>(wsTopic, (data) => {
      const appNotif = toAppNotification(data)
      setNotifications((prev) => [appNotif, ...prev.filter((n) => n.id !== appNotif.id)])
      setUnreadCount((c) => c + 1)
      setHasNewNotification(true)

      const toastType = data.type.includes('FAIL') || data.type.includes('REJECT')
        ? 'error'
        : data.type.includes('QUOTA')
        ? 'warning'
        : 'info'
      showToast({
        type: toastType,
        title: appNotif.title,
        description: appNotif.description,
      })
    })

    // 5. Subscribe to User-targeted queue
    const userQueue = `/user/queue/notifications`
    const unsubscribeUser = webSocketService.subscribe<BackendNotification>(userQueue, (data) => {
      const appNotif = toAppNotification(data)
      setNotifications((prev) => [appNotif, ...prev.filter((n) => n.id !== appNotif.id)])
      setUnreadCount((c) => c + 1)
      setHasNewNotification(true)

      const toastType = data.type.includes('FAIL') || data.type.includes('REJECT')
        ? 'error'
        : data.type.includes('APPROVE')
        ? 'success'
        : 'info'
      showToast({
        type: toastType,
        title: appNotif.title,
        description: appNotif.description,
      })
    })

    return () => {
      unsubscribeOnConnect()
      unsubscribeWs()
      unsubscribeUser()
    }
  }, [currentWorkspaceId, isAuthenticated, showToast, syncFromApi])

  const clearNewNotificationFlag = useCallback(() => {
    setHasNewNotification(false)
  }, [])

  const markAsRead = useCallback(
    async (id: string) => {
      if (!currentWorkspaceId) return
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
      try {
        await notificationService.markAsRead(currentWorkspaceId, id)
      } catch (err) {
        console.error('Failed to mark notification as read', err)
      }
    },
    [currentWorkspaceId]
  )

  const markAllAsRead = useCallback(async () => {
    if (!currentWorkspaceId) return
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
    try {
      await notificationService.markAllAsRead(currentWorkspaceId)
    } catch (err) {
      console.error('Failed to mark all notifications as read', err)
    }
  }, [currentWorkspaceId])

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        hasNewNotification,
        clearNewNotificationFlag,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
