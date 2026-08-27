import React from 'react'
import { HardDrive, ArrowUpRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { PermissionGate, PERMISSIONS } from '../../permissions'

export interface UsageCardProps {
  planName?: string
  emailsUsed?: number
  emailsTotal?: number
  contactsUsed?: number
  contactsTotal?: number
  resetDate?: string
  onUpgrade?: () => void
  className?: string
}

export const UsageCard: React.FC<UsageCardProps> = ({
  planName = 'Enterprise Plan',
  emailsUsed = 142850,
  emailsTotal = 500000,
  contactsUsed = 14250,
  contactsTotal = 50000,
  resetDate = '01/09/2026',
  onUpgrade,
  className,
}) => {
  const emailPct = Math.min(100, Math.round((emailsUsed / emailsTotal) * 100))
  const contactPct = Math.min(100, Math.round((contactsUsed / contactsTotal) * 100))

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-base">Hạn Ngạch Workspace (Usage Quota)</CardTitle>
        </div>
        <Badge variant="default" className="text-xs font-bold font-mono">
          {planName}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric 1: Emails Sent */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Email Đã Gửi Tháng Này:
            </span>
            <span className="font-mono text-slate-500">
              <strong className="text-slate-900 dark:text-slate-100 font-bold">
                {emailsUsed.toLocaleString()}
              </strong>{' '}
              / {emailsTotal.toLocaleString()} ({emailPct}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${emailPct}%` }}
              className={`h-full rounded-full transition-all ${
                emailPct > 90
                  ? 'bg-rose-500'
                  : emailPct > 75
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
            />
          </div>
        </div>

        {/* Metric 2: Contacts Stored */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Danh Bạ Khách Hàng (Audience):
            </span>
            <span className="font-mono text-slate-500">
              <strong className="text-slate-900 dark:text-slate-100 font-bold">
                {contactsUsed.toLocaleString()}
              </strong>{' '}
              / {contactsTotal.toLocaleString()} ({contactPct}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${contactPct}%` }}
              className="h-full rounded-full bg-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Reset date & Upgrade button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 text-[11px]">
            Làm mới hạn ngạch vào: <strong>{resetDate}</strong>
          </span>

          <PermissionGate permission={PERMISSIONS.BILLING_MANAGE}>
            <Button
              variant="outline"
              size="sm"
              onClick={onUpgrade}
              className="text-xs font-bold"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              Nâng Cấp Hạn Ngạch
            </Button>
          </PermissionGate>
        </div>
      </CardContent>
    </Card>
  )
}

export default UsageCard
