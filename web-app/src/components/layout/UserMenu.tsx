import React from 'react'
import {
  User,
  LogOut,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from '../ui/DropdownMenu'
import { useToast } from '../ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { useWorkspace } from '../../context/WorkspaceContext'
import { ROLES_METADATA, type WorkspaceRole } from '../../permissions/roles'
import { displayName, formatAccountRole } from '../../services/user.service'

export interface UserMenuProps {
  collapsed?: boolean
  avatarUrl?: string
  role?: string
  isDark?: boolean
  onToggleTheme?: () => void
  onNavigate?: (path: string) => void
  onLogout?: () => void
  className?: string
}

function getRoleBadgeLabel(role: string, meta: (typeof ROLES_METADATA)[WorkspaceRole] | null): string {
  if (role === 'ADMIN') return 'Admin'
  if (role === 'CAMPAIGN_EDITOR') return 'Editor'
  if (role === 'MARKETING_MANAGER') return 'Manager'
  if (role === 'CONTACT_MANAGER') return 'Contacts'
  if (role === 'BILLING_MANAGER') return 'Billing'
  return meta?.name ?? role
}

export const UserMenu: React.FC<UserMenuProps> = ({
  collapsed = false,
  avatarUrl,
  role,
  onNavigate,
  onLogout,
  className,
}) => {
  const { showToast } = useToast()
  const { user } = useAuth()

  let workspaceRole: WorkspaceRole | undefined
  try {
    const ws = useWorkspace()
    workspaceRole = ws.currentRole
  } catch {
    /* fallback if used outside WorkspaceProvider */
  }

  const effectiveRole = role || workspaceRole
  const roleMeta =
    effectiveRole && effectiveRole in ROLES_METADATA
      ? ROLES_METADATA[effectiveRole as WorkspaceRole]
      : null

  const userName = user ? displayName(user) : 'Người dùng MailFlow'
  const userEmail = user?.email ?? 'user@mailflow.vn'
  const roleLabel = effectiveRole
    ? getRoleBadgeLabel(effectiveRole, roleMeta)
    : user
    ? formatAccountRole(user.roles)
    : 'Member'
  const badgeVariant = roleMeta?.badgeVariant ?? 'default'
  const resolvedAvatar = user?.avatarUrl || avatarUrl

  const handleLogout = async () => {
    if (onLogout) {
      onLogout()
      return
    }
    showToast({
      type: 'info',
      title: 'Đăng xuất',
      description: 'Bạn đã đăng xuất khỏi phiên làm việc hiện tại.',
    })
    onNavigate?.('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none text-left focus:outline-none focus:ring-2 focus:ring-blue-500/30',
            collapsed && 'justify-center p-1',
            className
          )}
          title={collapsed ? `${userName} (${roleMeta?.titleVn || roleLabel})` : undefined}
          aria-label="Menu tài khoản người dùng"
        >
          <Avatar
            src={resolvedAvatar}
            fallbackText={user?.firstName || userName}
            size={collapsed ? 'sm' : 'md'}
            status="online"
          />

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                  {userName}
                </span>
                <Badge size="sm" variant={badgeVariant} className="text-[10px] px-1.5 py-0 h-4 uppercase">
                  {roleLabel}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">{userEmail}</p>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={collapsed ? 'center' : 'end'} className="w-60">
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal py-2 px-3 border-b border-slate-100 dark:border-slate-800">
          <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{userName}</div>
          <div className="text-[11px] text-slate-500 truncate font-mono mt-0.5">{userEmail}</div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Badge size="sm" variant={badgeVariant} className="text-[10px] px-1.5 py-0.5 uppercase">
              {roleLabel}
            </Badge>
            {roleMeta?.titleVn && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                ({roleMeta.titleVn})
              </span>
            )}
          </div>
        </DropdownMenuLabel>

        {/* Profile Links */}
        <DropdownMenuItem
          onClick={() => {
            if (onNavigate) onNavigate('/settings/profile')
            else showToast({ type: 'info', title: 'Hồ sơ cá nhân', description: 'Mở trang hồ sơ cá nhân' })
          }}
        >
          <User className="w-4 h-4 mr-2 text-slate-400" />
          <span>Hồ sơ cá nhân</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem variant="danger" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          <span>Đăng xuất</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserMenu
