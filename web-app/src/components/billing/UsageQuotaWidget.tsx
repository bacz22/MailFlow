import React from 'react'
import { Mail, Users, AlertTriangle, AlertCircle, CheckCircle2, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import type { UsageQuota } from '../../types/billing.types'

export interface UsageQuotaWidgetProps {
  emailsUsage: UsageQuota
  contactsUsage?: UsageQuota
  /** Demo: hide contacts bar until real contacts quota exists */
  showContacts?: boolean
  onUpgradeClick?: () => void
}

function getThresholdState(current: number, limit: number): {
  type: 'normal' | 'near_limit' | 'exceeded'
  label: string
  percent: number
  variant: 'default' | 'warning' | 'danger' | 'success'
  colorClass: string
  icon: React.ReactNode
} {
  const percent = Math.min(100, Math.round((current / Math.max(limit, 1)) * 100))

  if (percent >= 100) {
    return {
      type: 'exceeded',
      label: 'Đã Đạt Hạn Ngạch (100%)',
      percent,
      variant: 'danger',
      colorClass: 'bg-rose-600 text-rose-600',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
    }
  }

  if (percent >= 80) {
    return {
      type: 'near_limit',
      label: `Sắp Chạm Giới Hạn (${percent}%)`,
      percent,
      variant: 'warning',
      colorClass: 'bg-amber-500 text-amber-600',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
    }
  }

  return {
    type: 'normal',
    label: `Bình Thường (${percent}%)`,
    percent,
    variant: 'success',
    colorClass: 'bg-blue-600 text-blue-600',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
  }
}

export const UsageQuotaWidget: React.FC<UsageQuotaWidgetProps> = ({
  emailsUsage,
  contactsUsage,
  showContacts = false,
  onUpgradeClick,
}) => {
  const emailThreshold = getThresholdState(emailsUsage.current, emailsUsage.limit)
  const contactThreshold =
    showContacts && contactsUsage
      ? getThresholdState(contactsUsage.current, contactsUsage.limit)
      : null

  const showWarning =
    emailThreshold.type !== 'normal' ||
    (contactThreshold != null && contactThreshold.type !== 'normal')

  return (
    <Card className="border border-slate-200/90 dark:border-slate-800/90">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm">Hạn Ngạch & Tình Trạng Sử Dụng (Quotas & Limits)</CardTitle>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Làm mới hạn ngạch: {emailsUsage.resetDate}
          </span>
        </div>
        <CardDescription className="text-xs">
          Demo Free: hạn mức email gửi mỗi ngày theo workspace (reset 00:00 GMT+7).
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* 1. EMAILS USAGE — real API */}
        <div className="space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Lượng Email Đã Gửi Hôm Nay</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-700 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-slate-100">
                  {emailsUsage.current.toLocaleString()}
                </strong>{' '}
                / {emailsUsage.limit.toLocaleString()} email
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold">
                {emailThreshold.icon}
                <span
                  className={
                    emailThreshold.variant === 'danger'
                      ? 'text-rose-600'
                      : emailThreshold.variant === 'warning'
                        ? 'text-amber-600'
                        : 'text-slate-500'
                  }
                >
                  {emailThreshold.label}
                </span>
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              style={{ width: `${emailThreshold.percent}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                emailThreshold.type === 'exceeded'
                  ? 'bg-rose-600'
                  : emailThreshold.type === 'near_limit'
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Còn lại:{' '}
              <strong>{(emailsUsage.limit - emailsUsage.current).toLocaleString()}</strong> email
            </span>
            <span>Tự động làm mới vào 00:00 ngày {emailsUsage.resetDate}</span>
          </div>
        </div>

        {/* 2. CONTACTS STORAGE — mock, ẩn tạm đến khi có API hạn ngạch danh bạ */}
        {showContacts && contactsUsage && contactThreshold && (
          <div className="space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                <Users className="w-4 h-4 text-cyan-600" />
                <span>Dung Lượng Danh Bạ Liên Hệ (Subscribers Limit)</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-slate-100">
                    {contactsUsage.current.toLocaleString()}
                  </strong>{' '}
                  / {contactsUsage.limit.toLocaleString()} liên hệ
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold">
                  {contactThreshold.icon}
                  <span
                    className={
                      contactThreshold.variant === 'danger'
                        ? 'text-rose-600'
                        : contactThreshold.variant === 'warning'
                          ? 'text-amber-600'
                          : 'text-slate-500'
                    }
                  >
                    {contactThreshold.label}
                  </span>
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                style={{ width: `${contactThreshold.percent}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  contactThreshold.type === 'exceeded'
                    ? 'bg-rose-600'
                    : contactThreshold.type === 'near_limit'
                      ? 'bg-amber-500'
                      : 'bg-cyan-600'
                }`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Khả dụng thêm:{' '}
                <strong>{(contactsUsage.limit - contactsUsage.current).toLocaleString()}</strong>{' '}
                liên hệ
              </span>
              <span>Chỉ tính các liên hệ trạng thái Subscribed</span>
            </div>
          </div>
        )}

        {showWarning && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Bạn đã sử dụng trên <strong>80%</strong> hạn ngạch gửi email hôm nay.
              </span>
            </div>
            {onUpgradeClick && (
              <button
                type="button"
                onClick={onUpgradeClick}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
              >
                Nâng Hạn Ngạch
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default UsageQuotaWidget
