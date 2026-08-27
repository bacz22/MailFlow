import React, { useState } from 'react'
import {
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Building2,
  Loader2,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useToast } from '../ui/Toast'

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

const DEFAULT_WORKSPACES: WorkspaceItem[] = [
  {
    id: 'ws-1',
    name: 'Acme Marketing Group',
    plan: 'Enterprise',
    logoText: 'A',
    role: 'Owner',
    isCurrent: true,
  },
  {
    id: 'ws-2',
    name: 'TechCorp Vietnam Ltd',
    plan: 'Pro',
    logoText: 'T',
    role: 'Admin',
  },
  {
    id: 'ws-3',
    name: 'MailFlow Staging Env',
    plan: 'Starter',
    logoText: 'M',
    role: 'Editor',
  },
  {
    id: 'ws-4',
    name: 'Personal Sandbox',
    plan: 'Free',
    logoText: 'P',
    role: 'Viewer',
  },
]

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  collapsed = false,
  currentWorkspaceId = 'ws-1',
  onWorkspaceChange,
  className,
}) => {
  const { showToast } = useToast()
  const [workspaces] = useState<WorkspaceItem[]>(DEFAULT_WORKSPACES)
  const [activeId, setActiveId] = useState(currentWorkspaceId)
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const currentWorkspace = workspaces.find((w) => w.id === activeId) || workspaces[0]

  const filteredWorkspaces = workspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ws.plan.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (id: string) => {
    setIsLoading(true)
    setTimeout(() => {
      setActiveId(id)
      onWorkspaceChange?.(id)
      setIsLoading(false)
      setIsOpen(false)
      const selected = workspaces.find((w) => w.id === id)
      showToast({
        type: 'info',
        title: 'Chuyển Workspace',
        description: `Đã chuyển sang không gian làm việc: ${selected?.name}`,
      })
    }, 200)
  }

  const handleCreateWorkspace = () => {
    setIsOpen(false)
    showToast({
      type: 'info',
      title: 'Tạo Workspace Mới',
      description: 'Modal tạo Workspace sẽ được mở (Prompt 06)',
    })
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

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'w-full flex items-center justify-between gap-2.5 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer select-none text-left focus:outline-none focus:ring-2 focus:ring-blue-500/30',
            collapsed && 'justify-center p-1.5',
            className
          )}
          title={collapsed ? currentWorkspace.name : undefined}
          aria-label="Chuyển đổi workspace"
        >
          {/* Logo icon */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              currentWorkspace.logoText || <Building2 className="w-4 h-4" />
            )}
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {currentWorkspace.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                  <span className="font-medium text-blue-600 dark:text-blue-400">{currentWorkspace.plan}</span>
                  <span>•</span>
                  <span className="capitalize">{currentWorkspace.role}</span>
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
          {/* Search box if multiple workspaces */}
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

          {/* List of Workspaces */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              Không Gian Làm Việc ({filteredWorkspaces.length})
            </div>

            {filteredWorkspaces.map((ws) => {
              const isSelected = ws.id === activeId
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
                  <div className="w-7 h-7 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                    {ws.logoText || ws.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold">{ws.name}</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      <Badge size="sm" variant={getPlanBadgeVariant(ws.plan) as any}>
                        {ws.plan}
                      </Badge>
                      <span className="truncate">• {ws.role}</span>
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

          {/* Create New Workspace button */}
          <div className="pt-2 mt-1.5 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleCreateWorkspace}
            >
              Tạo Không Gian Làm Việc Mới
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export default WorkspaceSwitcher
