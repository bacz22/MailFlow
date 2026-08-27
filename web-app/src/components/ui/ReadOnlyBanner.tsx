import React from 'react'
import { Eye } from 'lucide-react'
import { usePermission } from '../../permissions'

export interface ReadOnlyBannerProps {
  resourceName?: string
  className?: string
}

export const ReadOnlyBanner: React.FC<ReadOnlyBannerProps> = ({
  resourceName = 'tài nguyên này',
  className = '',
}) => {
  const { currentRole, roleMetadata } = usePermission()
  const isReadOnly = currentRole === 'VIEWER' || currentRole === 'ANALYST'

  if (!isReadOnly) return null

  return (
    <div
      className={`p-3.5 px-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in-0 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center shrink-0">
          <Eye className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <div className="font-bold flex items-center gap-1.5">
            <span>Chế Độ Xem (Read-Only Mode)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
              {roleMetadata.name}
            </span>
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/90 leading-tight">
            Bạn có quyền xem thông tin {resourceName}, nhưng không có quyền tạo mới, chỉnh sửa, gửi hoặc xóa dữ liệu.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ReadOnlyBanner
