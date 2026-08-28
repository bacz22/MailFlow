import React, { useState } from 'react'
import {
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Building2,
  KeyRound,
  Loader2,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useToast } from '../ui/Toast'
import { useWorkspace } from '../../context/WorkspaceContext'
import { ApiError } from '../../services/apiClient'
import { AcceptInvitationDialog } from '../workspace/AcceptInvitationDialog'
import { ROLES_METADATA } from '../../permissions/roles'
import type { WorkspaceRole } from '../../permissions/roles'

export interface WorkspaceItem {
  id: string
  name: string
  plan: 'Free' | 'Starter' | 'Pro' | 'Enterprise'
  logoText?: string
  role: string
  isCurrent?: boolean
}

export interface WorkspaceSwitcherProps {
  collapsed?: boolean
  currentWorkspaceId?: string
  onWorkspaceChange?: (workspaceId: string) => void
  className?: string
}

function roleLabel(role: string): string {
  const meta = ROLES_METADATA[role as WorkspaceRole]
  return meta?.name ?? role
}

function WorkspaceMark({
  name,
  logoUrl,
  className,
}: {
  name?: string
  logoUrl?: string
  className: string
}) {
  const letter = name?.charAt(0)?.toUpperCase() || 'W'
  return (
    <div className={cn(className, 'overflow-hidden shrink-0')}>
      {logoUrl ? (
        <img src={logoUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        letter
      )}
    </div>
  )
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  collapsed = false,
  onWorkspaceChange,
  className,
}) => {
  const { showToast } = useToast()
  const { workspaces, currentWorkspaceId, loading, switchWorkspace, createWorkspace } = useWorkspace()
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showAcceptInvite, setShowAcceptInvite] = useState(false)
  const [newName, setNewName] = useState('')

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0]

  const filteredWorkspaces = workspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ws.plan || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = async (id: string) => {
    if (id === currentWorkspaceId) {
      setIsOpen(false)
      return
    }
    setIsSwitching(true)
    try {
      await switchWorkspace(id)
      onWorkspaceChange?.(id)
      setIsOpen(false)
      const selected = workspaces.find((w) => w.id === id)
      showToast({
        type: 'info',
        title: 'Chuyển Workspace',
        description: `Đã chuyển sang không gian làm việc: ${selected?.name}`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thể chuyển workspace',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsSwitching(false)
    }
  }

  const handleCreateWorkspace = async () => {
    const name = newName.trim()
    if (!name) {
      return
    }
    setIsCreating(true)
    try {
      await createWorkspace(name)
      setNewName('')
      setShowCreate(false)
      setIsOpen(false)
      showToast({
        type: 'success',
        title: 'Đã tạo workspace',
        description: `Không gian làm việc “${name}” đã sẵn sàng.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thể tạo workspace',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'Enterprise':
        return 'default'
      case 'Pro':
        return 'info'
      case 'Starter':
        return 'warning'
      default:
        return 'neutral'
    }
  }

  const busy = loading || isSwitching

  return (
    <>
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'w-full flex items-center justify-between gap-2.5 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer select-none text-left focus:outline-none focus:ring-2 focus:ring-blue-500/30',
            collapsed && 'justify-center p-1.5',
            className
          )}
          title={collapsed ? currentWorkspace?.name : undefined}
          aria-label="Chuyển đổi workspace"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 overflow-hidden">
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : currentWorkspace ? (
              currentWorkspace.logoUrl ? (
                <img src={currentWorkspace.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                currentWorkspace.name.charAt(0).toUpperCase()
              )
            ) : (
              <Building2 className="w-4 h-4" />
            )}
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {currentWorkspace?.name || (loading ? 'Đang tải…' : 'Chưa có workspace')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {currentWorkspace?.plan || 'Free'}
                  </span>
                  <span>•</span>
                  <span className="capitalize">{currentWorkspace ? roleLabel(currentWorkspace.role) : '—'}</span>
                </div>
              </div>

              <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0 opacity-70" />
            </>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={collapsed ? 'center' : 'start'}
          sideOffset={6}
          className="z-50 w-72 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150 text-slate-900 dark:text-slate-100"
        >
          <div className="p-1 mb-1.5 relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm workspace..."
              className="input-control w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              Không Gian Làm Việc ({filteredWorkspaces.length})
            </div>

            {filteredWorkspaces.map((ws) => {
              const isSelected = ws.id === currentWorkspaceId
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => handleSelect(ws.id)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2.5 p-2 rounded-xl text-xs transition-colors cursor-pointer select-none text-left',
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  )}
                >
                  <WorkspaceMark
                    name={ws.name}
                    logoUrl={ws.logoUrl}
                    className="w-7 h-7 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold">{ws.name}</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      <Badge size="sm" variant={getPlanBadgeVariant(ws.plan) as 'default' | 'info' | 'warning' | 'neutral'}>
                        {ws.plan}
                      </Badge>
                      <span className="truncate">• {roleLabel(ws.role)}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </button>
              )
            })}

            {filteredWorkspaces.length === 0 && (
              <div className="text-center py-4 text-xs text-slate-400">
                Không tìm thấy workspace nào
              </div>
            )}
          </div>

          <div className="pt-2 mt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {showCreate ? (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Tên workspace mới"
                  className="input-control w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleCreateWorkspace()
                    }
                  }}
                />
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-center text-xs"
                    onClick={() => {
                      setShowCreate(false)
                      setNewName('')
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 justify-center text-xs"
                    isLoading={isCreating}
                    disabled={!newName.trim()}
                    onClick={() => void handleCreateWorkspace()}
                  >
                    Tạo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center text-xs"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setShowCreate(true)}
                >
                  Tạo Không Gian Làm Việc Mới
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-xs"
                  leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setIsOpen(false)
                    setShowAcceptInvite(true)
                  }}
                >
                  Tham gia bằng mã lời mời
                </Button>
              </div>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
    <AcceptInvitationDialog
      isOpen={showAcceptInvite}
      onClose={() => setShowAcceptInvite(false)}
    />
    </>
  )
}

export default WorkspaceSwitcher
