import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { workspaceService } from '../services/workspace.service'
import { getAccessToken, setAfterTokenRefresh, ApiError } from '../services/apiClient'
import { useAuth } from './AuthContext'
import { usePermission } from '../permissions/PermissionContext'
import { ROLES } from '../permissions/roles'
import type { WorkspaceRole } from '../permissions/roles'
import type { WorkspaceSummary, SwitchWorkspaceResponse } from '../types/workspace.types'
import { workspaceRoleFromAccessToken } from '../utils/jwt'

const LAST_WORKSPACE_KEY = 'mailflow_workspace_id'
const PENDING_INVITE_KEY = 'mailflow_pending_invite'

export interface InviteNotice {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
}

interface WorkspaceContextValue {
  workspaces: WorkspaceSummary[]
  currentWorkspaceId: string | null
  currentRole: WorkspaceRole
  loading: boolean
  inviteNotice: InviteNotice | null
  clearInviteNotice: () => void
  refreshWorkspaces: () => Promise<void>
  switchWorkspace: (workspaceId: string) => Promise<void>
  createWorkspace: (name: string) => Promise<void>
  deleteCurrentWorkspace: () => Promise<void>
  acceptInvitation: (rawToken: string) => Promise<SwitchWorkspaceResponse>
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined)

function persistLastWorkspace(workspaceId: string | null) {
  try {
    if (workspaceId) {
      localStorage.setItem(LAST_WORKSPACE_KEY, workspaceId)
    } else {
      localStorage.removeItem(LAST_WORKSPACE_KEY)
    }
  } catch {
    /* ignore */
  }
}

function readLastWorkspace(): string | null {
  try {
    return localStorage.getItem(LAST_WORKSPACE_KEY)
  } catch {
    return null
  }
}

function readPendingInvite(): string | null {
  try {
    return sessionStorage.getItem(PENDING_INVITE_KEY)
  } catch {
    return null
  }
}

function persistPendingInvite(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem(PENDING_INVITE_KEY, token)
    } else {
      sessionStorage.removeItem(PENDING_INVITE_KEY)
    }
  } catch {
    /* ignore */
  }
}

function toWorkspaceRole(role: string | undefined): WorkspaceRole {
  if (role && role in ROLES) {
    return role as WorkspaceRole
  }
  return ROLES.VIEWER
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const userId = user?.id
  const { switchRole } = usePermission()
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([])
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [currentRole, setCurrentRole] = useState<WorkspaceRole>(ROLES.VIEWER)
  const [loading, setLoading] = useState(false)
  const [inviteNotice, setInviteNotice] = useState<InviteNotice | null>(null)
  const bootstrappingRef = useRef(false)

  const applyRole = useCallback(
    (workspaceId: string, role: WorkspaceRole) => {
      setCurrentWorkspaceId(workspaceId)
      setCurrentRole(role)
      switchRole(role)
      persistLastWorkspace(workspaceId)
      setWorkspaces((prev) => prev.map((ws) => ({ ...ws, isCurrent: ws.id === workspaceId })))
    },
    [switchRole]
  )

  const applySwitch = useCallback(
    async (workspaceId: string, options?: { skipRefresh?: boolean }) => {
      const res = await workspaceService.switchWorkspace(workspaceId, options)
      const fromToken = workspaceRoleFromAccessToken(getAccessToken())
      applyRole(res.workspaceId, fromToken !== ROLES.VIEWER ? fromToken : toWorkspaceRole(res.role))
    },
    [applyRole]
  )

  const acceptInvitation = useCallback(
    async (rawToken: string) => {
      const token = rawToken.trim()
      if (!token) {
        throw new ApiError({
          type: 'https://mailflow.dev/problems/invalid-token',
          title: 'Thiếu mã lời mời',
          status: 400,
          code: 'INVALID_TOKEN',
          detail: 'Vui lòng dán mã lời mời nhận được trong email.',
        })
      }
      const res = await workspaceService.acceptInvitation(token)
      persistPendingInvite(null)
      const fromToken = workspaceRoleFromAccessToken(getAccessToken())
      applyRole(res.workspaceId, fromToken !== ROLES.VIEWER ? fromToken : toWorkspaceRole(res.role))
      const list = await workspaceService.list()
      setWorkspaces(list.map((ws) => ({ ...ws, isCurrent: ws.id === res.workspaceId })))
      return res
    },
    [applyRole]
  )

  const refreshWorkspaces = useCallback(async () => {
    const list = await workspaceService.list()
    setWorkspaces(list)
    const saved = readLastWorkspace()
    const target = list.find((ws) => ws.id === saved) || list.find((ws) => ws.isCurrent) || list[0]
    if (target) {
      await applySwitch(target.id)
    } else {
      setCurrentWorkspaceId(null)
      setCurrentRole(ROLES.VIEWER)
      switchRole(ROLES.VIEWER)
    }
  }, [applySwitch, switchRole])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const inviteFromUrl = params.get('invite')?.trim()
    if (inviteFromUrl) {
      persistPendingInvite(inviteFromUrl)
      params.delete('invite')
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`
      window.history.replaceState({}, '', next)
    }

    if (!userId) {
      setWorkspaces([])
      setCurrentWorkspaceId(null)
      setCurrentRole(ROLES.VIEWER)
      switchRole(ROLES.VIEWER)
      setAfterTokenRefresh(null)
      return
    }

    let cancelled = false
    bootstrappingRef.current = true
    setLoading(true)

    ;(async () => {
      const invite = inviteFromUrl || readPendingInvite()
      if (invite) {
        try {
          const res = await acceptInvitation(invite)
          if (!cancelled) {
            setInviteNotice({
              type: 'success',
              title: 'Đã chấp nhận lời mời',
              description: `Bạn đã tham gia workspace ${res.workspaceName}.`,
            })
          }
          if (!cancelled) {
            setLoading(false)
          }
          bootstrappingRef.current = false
          return
        } catch (error) {
          persistPendingInvite(null)
          if (!cancelled) {
            setInviteNotice({
              type: 'error',
              title: 'Không chấp nhận được lời mời',
              description: error instanceof ApiError ? error.detail : 'Mã lời mời không hợp lệ hoặc đã hết hạn.',
            })
          }
        }
      }
      try {
        await refreshWorkspaces()
      } catch {
        if (!cancelled) {
          setWorkspaces([])
        }
      } finally {
        bootstrappingRef.current = false
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, refreshWorkspaces, switchRole, applyRole, acceptInvitation])

  useEffect(() => {
    setAfterTokenRefresh(async () => {
      if (bootstrappingRef.current) {
        return
      }
      const saved = readLastWorkspace()
      if (!saved) {
        return
      }
      try {
        await applySwitch(saved, { skipRefresh: true })
      } catch {
        /* keep account-scoped token from refresh */
      }
    })
    return () => setAfterTokenRefresh(null)
  }, [applySwitch])

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      await applySwitch(workspaceId)
    },
    [applySwitch]
  )

  const createWorkspace = useCallback(
    async (name: string) => {
      const created = await workspaceService.create(name)
      setWorkspaces((prev) => [...prev, created])
      await applySwitch(created.id)
    },
    [applySwitch]
  )

  const deleteCurrentWorkspace = useCallback(async () => {
    if (!currentWorkspaceId) return
    await workspaceService.deleteWorkspace(currentWorkspaceId)
    persistLastWorkspace(null)
    await refreshWorkspaces()
  }, [currentWorkspaceId, refreshWorkspaces])

  const clearInviteNotice = useCallback(() => setInviteNotice(null), [])

  const value = useMemo(
    () => ({
      workspaces,
      currentWorkspaceId,
      currentRole,
      loading,
      inviteNotice,
      clearInviteNotice,
      refreshWorkspaces,
      switchWorkspace,
      createWorkspace,
      deleteCurrentWorkspace,
      acceptInvitation,
    }),
    [
      workspaces,
      currentWorkspaceId,
      currentRole,
      loading,
      inviteNotice,
      clearInviteNotice,
      refreshWorkspaces,
      switchWorkspace,
      createWorkspace,
      deleteCurrentWorkspace,
      acceptInvitation,
    ]
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}
