import React, { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  ListFilter,
  Layers,
  Send,
  FileText,
  // BarChart3, // Analytics mock — ẩn tạm
  UserCheck,
  AtSign,
  Globe,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { SidebarGroup } from './SidebarGroup'
import { SidebarItem } from './SidebarItem'
import { UserMenu } from './UserMenu'
import { Tooltip } from '../ui/Tooltip'
import { usePermission } from '../../permissions/PermissionContext'
import { useWorkspace } from '../../context/WorkspaceContext'
import { contactService } from '../../services/contact.service'
import { campaignService } from '../../services/campaign.service'

function formatNavCount(value: number): string {
  if (value < 1000) {
    return String(value)
  }
  if (value < 1_000_000) {
    const thousands = value / 1000
    const compact = (thousands >= 10 ? thousands.toFixed(0) : thousands.toFixed(1)).replace(/\.0$/, '')
    return `${compact}k`
  }
  const millions = value / 1_000_000
  const compact = (millions >= 10 ? millions.toFixed(0) : millions.toFixed(1)).replace(/\.0$/, '')
  return `${compact}m`
}

export interface SidebarProps {
  currentPath?: string
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNavigate?: (path: string) => void
  onLogout?: () => void
  isDark?: boolean
  onToggleTheme?: () => void
  className?: string
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath = '/dashboard',
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  onLogout,
  isDark = true,
  onToggleTheme,
  className,
}) => {
  const { canAccessRoute } = usePermission()
  const { currentWorkspaceId } = useWorkspace()
  const [contactCount, setContactCount] = useState<number | null>(null)
  const [campaignCount, setCampaignCount] = useState<number | null>(null)

  const handleNav = (path: string) => {
    onNavigate?.(path)
  }

  // Permission checks for each item
  const canDashboard = canAccessRoute('/dashboard')
  const canContacts = canAccessRoute('/contacts')
  const canLists = canAccessRoute('/lists')
  const canSegments = canAccessRoute('/segments')
  const canCampaigns = canAccessRoute('/campaigns')
  const canTemplates = canAccessRoute('/templates')
  // const canReports = canAccessRoute('/reports') // Analytics mock — ẩn tạm
  const canMembers = canAccessRoute('/members')
  const canSenders = canAccessRoute('/settings/senders')
  const canDomains = canAccessRoute('/settings/domains')
  const canBilling = canAccessRoute('/settings/billing')
  const canWorkspace = canAccessRoute('/settings/workspace')

  const hasAudienceGroup = canContacts || canLists || canSegments
  const hasCampaignsGroup = canCampaigns || canTemplates
  const hasSettingsGroup = canSenders || canDomains || canBilling || canWorkspace

  useEffect(() => {
    if (!canContacts || !currentWorkspaceId) {
      setContactCount(null)
      return
    }
    let cancelled = false
    contactService
      .stats()
      .then((stats) => {
        if (!cancelled) {
          setContactCount(stats.total)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContactCount(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [canContacts, currentWorkspaceId, currentPath])

  useEffect(() => {
    if (!canCampaigns || !currentWorkspaceId) {
      setCampaignCount(null)
      return
    }
    let cancelled = false
    campaignService
      .list()
      .then((rows) => {
        if (!cancelled) {
          setCampaignCount(rows.length)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCampaignCount(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [canCampaigns, currentWorkspaceId, currentPath])

  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 z-30 shrink-0 select-none',
        collapsed ? 'w-18' : 'w-64',
        className
      )}
      aria-label="Sidebar chính"
    >
      {/* 1. Header with Workspace Switcher */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800/80">
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      {/* 2. Scrollable Navigation Menu (Filtered by Permissions) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        {/* OVERVIEW */}
        {canDashboard && (
          <SidebarGroup label="Tổng Quan" collapsed={collapsed}>
            <SidebarItem
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="Dashboard"
              active={currentPath === '/dashboard'}
              collapsed={collapsed}
              onClick={() => handleNav('/dashboard')}
            />
          </SidebarGroup>
        )}

        {/* AUDIENCE */}
        {hasAudienceGroup && (
          <SidebarGroup label="Đối Tượng (Audience)" collapsed={collapsed}>
            {canContacts && (
              <SidebarItem
                icon={<Users className="w-4 h-4" />}
                label="Contacts"
                active={currentPath === '/contacts'}
                badge={contactCount == null ? undefined : formatNavCount(contactCount)}
                collapsed={collapsed}
                onClick={() => handleNav('/contacts')}
              />
            )}
            {canLists && (
              <SidebarItem
                icon={<ListFilter className="w-4 h-4" />}
                label="Lists"
                active={currentPath === '/lists'}
                collapsed={collapsed}
                onClick={() => handleNav('/lists')}
              />
            )}
            {canSegments && (
              <SidebarItem
                icon={<Layers className="w-4 h-4" />}
                label="Segments"
                active={currentPath === '/segments'}
                collapsed={collapsed}
                onClick={() => handleNav('/segments')}
              />
            )}
          </SidebarGroup>
        )}

        {/* CAMPAIGNS */}
        {hasCampaignsGroup && (
          <SidebarGroup label="Chiến Dịch (Campaigns)" collapsed={collapsed}>
            {canCampaigns && (
              <SidebarItem
                icon={<Send className="w-4 h-4" />}
                label="Campaigns"
                active={currentPath === '/campaigns' || currentPath.startsWith('/campaigns/')}
                badge={campaignCount == null ? undefined : formatNavCount(campaignCount)}
                collapsed={collapsed}
                onClick={() => handleNav('/campaigns')}
              />
            )}
            {canTemplates && (
              <SidebarItem
                icon={<FileText className="w-4 h-4" />}
                label="Templates"
                active={currentPath === '/templates'}
                collapsed={collapsed}
                onClick={() => handleNav('/templates')}
              />
            )}
          </SidebarGroup>
        )}

        {/* ANALYTICS — mock data, ẩn tạm khỏi menu đến khi có API thật
        {canReports && (
          <SidebarGroup label="Phân Tích" collapsed={collapsed}>
            <SidebarItem
              icon={<BarChart3 className="w-4 h-4" />}
              label="Analytics"
              active={currentPath === '/analytics' || currentPath === '/reports'}
              collapsed={collapsed}
              onClick={() => handleNav('/analytics')}
            />
          </SidebarGroup>
        )}
        */}

        {/* MANAGEMENT */}
        {canMembers && (
          <SidebarGroup label="Quản Trị" collapsed={collapsed}>
            <SidebarItem
              icon={<UserCheck className="w-4 h-4" />}
              label="Members"
              active={currentPath === '/members' || currentPath === '/settings/members'}
              collapsed={collapsed}
              onClick={() => handleNav('/settings/members')}
            />
          </SidebarGroup>
        )}

        {/* SETTINGS */}
        {hasSettingsGroup && (
          <SidebarGroup label="Cấu Hình" collapsed={collapsed}>
            {canSenders && (
              <SidebarItem
                icon={<AtSign className="w-4 h-4" />}
                label="Senders"
                active={currentPath === '/settings/senders'}
                collapsed={collapsed}
                onClick={() => handleNav('/settings/senders')}
              />
            )}
            {canDomains && (
              <SidebarItem
                icon={<Globe className="w-4 h-4" />}
                label="Domains"
                active={currentPath === '/settings/domains'}
                collapsed={collapsed}
                onClick={() => handleNav('/settings/domains')}
              />
            )}
            {canBilling && (
              <SidebarItem
                icon={<CreditCard className="w-4 h-4" />}
                label="Billing & Usage"
                active={currentPath === '/settings/billing'}
                collapsed={collapsed}
                onClick={() => handleNav('/settings/billing')}
              />
            )}
            {canWorkspace && (
              <SidebarItem
                icon={<Settings className="w-4 h-4" />}
                label="Workspace"
                active={currentPath === '/settings/workspace'}
                collapsed={collapsed}
                onClick={() => handleNav('/settings/workspace')}
              />
            )}
          </SidebarGroup>
        )}
      </div>

      {/* 3. Bottom Footer: User Menu with Active Role & Collapse Toggle */}
      <div className="p-2 border-t border-slate-100 dark:border-slate-800 space-y-1 bg-slate-50/50 dark:bg-slate-900/50">
        <UserMenu
          collapsed={collapsed}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onNavigate={handleNav}
          onLogout={onLogout}
        />

        {onToggleCollapse && (
          <div className="pt-1">
            <Tooltip content={collapsed ? 'Mở rộng menu (⌘B)' : 'Thu gọn menu (⌘B)'} side="right">
              <button
                type="button"
                onClick={onToggleCollapse}
                className={cn(
                  'w-full flex items-center gap-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors text-xs cursor-pointer',
                  collapsed ? 'justify-center' : 'justify-between'
                )}
                aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              >
                {!collapsed && <span className="text-[11px] font-medium">Thu gọn menu</span>}
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
