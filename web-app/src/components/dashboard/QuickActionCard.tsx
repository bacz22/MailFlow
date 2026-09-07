import React from 'react'
import { Upload, FileText, Send, Sparkles, Globe } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { PermissionGate, PERMISSIONS } from '../../permissions'
import { useToast } from '../ui/Toast'

export interface QuickActionCardProps {
  onNavigate?: (path: string) => void
  className?: string
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  onNavigate,
  className,
}) => {
  const { showToast } = useToast()

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-base">Thao Tác Nhanh (Quick Actions)</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Action 1: Create Campaign */}
        <PermissionGate permission={PERMISSIONS.CAMPAIGN_CREATE}>
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('/campaigns')
              else showToast({ type: 'info', title: 'Tạo Chiến Dịch', description: 'Mở trình tạo chiến dịch mới' })
            }}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-800 transition text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Tạo Chiến Dịch
              </div>
              <div className="text-[11px] text-slate-500">Soạn thảo & lên lịch gửi email</div>
            </div>
          </button>
        </PermissionGate>

        {/* Action 2: Import Contacts */}
        <PermissionGate permission={PERMISSIONS.CONTACT_IMPORT}>
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('/contacts')
              else showToast({ type: 'info', title: 'Import Danh Bạ', description: 'Mở hộp thoại tải lên danh bạ' })
            }}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-800 transition text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                Import Danh Bạ
              </div>
              <div className="text-[11px] text-slate-500">Nạp danh sách hàng loạt</div>
            </div>
          </button>
        </PermissionGate>

        {/* Action 3: Create Template */}
        <PermissionGate permission={PERMISSIONS.TEMPLATE_CREATE}>
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('/templates')
              else showToast({ type: 'info', title: 'Tạo Mẫu Email', description: 'Mở thư viện mẫu' })
            }}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-800 transition text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                Thiết Kế Mẫu Email
              </div>
              <div className="text-[11px] text-slate-500">Kéo thả template responsive</div>
            </div>
          </button>
        </PermissionGate>

        {/* Action 4: Domain DNS Setup */}
        <PermissionGate permission={PERMISSIONS.DOMAIN_READ}>
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('/settings/domains')
              else showToast({ type: 'info', title: 'Cấu Hình Tên Miền', description: 'Mở trang xác thực DNS' })
            }}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 dark:hover:border-sky-800 transition text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                Xác Thực Tên Miền DNS
              </div>
              <div className="text-[11px] text-slate-500">Cấu hình DKIM, SPF, DMARC</div>
            </div>
          </button>
        </PermissionGate>
      </CardContent>
    </Card>
  )
}

export default QuickActionCard
