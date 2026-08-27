import React from 'react'
import {
  ShieldAlert,
  Mail,
  Home,
  Lock,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { usePermission } from '../permissions/PermissionContext'
import { useToast } from '../components/ui/Toast'

export interface UnauthorizedPageProps {
  attemptedPath?: string
  requiredPermission?: string
  onNavigateHome?: () => void
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  attemptedPath,
  requiredPermission,
  onNavigateHome,
}) => {
  const { roleMetadata } = usePermission()
  const { showToast } = useToast()

  const handleRequestAccess = () => {
    showToast({
      type: 'info',
      title: 'Đã gửi yêu cầu',
      description: 'Yêu cầu mở rộng quyền hạn đã được gửi tới Quản trị viên (Admin/Owner) của Workspace.',
    })
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-8 animate-in fade-in-0 duration-200">
      <div className="max-w-xl w-full text-center space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow Background Accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* 403 Icon Box */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* Status Badge & Code */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <span>HTTP 403 • ACCESS DENIED</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Bạn Không Có Quyền Truy Cập
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Tài khoản của bạn hiện không có quyền hạn cần thiết để truy cập hoặc thao tác trên trang này.
          </p>
        </div>

        {/* Diagnostic Metadata Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
            <span className="text-slate-500">Vai trò hiện tại:</span>
            <div className="flex items-center gap-1.5">
              <Badge variant={roleMetadata.badgeVariant}>
                {roleMetadata.name} ({roleMetadata.titleVn})
              </Badge>
            </div>
          </div>

          {attemptedPath && (
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
              <span className="text-slate-500">Đường dẫn yêu cầu:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                {attemptedPath}
              </span>
            </div>
          )}

          {requiredPermission && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Quyền hạn cần có:</span>
              <span className="font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                {requiredPermission}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            leftIcon={<Home className="w-4 h-4" />}
            onClick={onNavigateHome || (() => (window.location.href = '/dashboard'))}
            className="w-full sm:w-auto"
          >
            Về Trang Chủ (Dashboard)
          </Button>

          <Button
            variant="outline"
            leftIcon={<Mail className="w-4 h-4" />}
            onClick={handleRequestAccess}
            className="w-full sm:w-auto"
          >
            Yêu Cầu Nâng Quyền
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedPage
