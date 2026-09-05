import React, { useEffect, useState } from 'react'
import { HardDrive, ArrowUpRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { PermissionGate, PERMISSIONS } from '../../permissions'
import { quotaService } from '../../services/quota.service'
import { formatResetLabel } from '../../types/quota.types'

export interface UsageCardProps {
  onUpgrade?: () => void
  className?: string
}

export const UsageCard: React.FC<UsageCardProps> = ({ onUpgrade, className }) => {
  const [emailsUsed, setEmailsUsed] = useState(0)
  const [emailsTotal, setEmailsTotal] = useState(50)
  const [resetDate, setResetDate] = useState('—')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const q = await quotaService.getDailySend()
        if (!cancelled) {
          setEmailsUsed(q.used)
          setEmailsTotal(q.limit)
          setResetDate(formatResetLabel(q.resetAt))
        }
      } catch {
        if (!cancelled) {
          setEmailsUsed(0)
          setEmailsTotal(50)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const emailPct =
    emailsTotal > 0 ? Math.min(100, Math.round((emailsUsed / emailsTotal) * 100)) : 0

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-base">Hạn Ngạch Workspace (Usage Quota)</CardTitle>
        </div>
        <Badge variant="default" className="text-xs font-bold font-mono">
          Demo Free
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Email đã gửi hôm nay:
            </span>
            <span className="font-mono text-slate-500">
              {loading ? (
                '…'
              ) : (
                <>
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">
                    {emailsUsed.toLocaleString()}
                  </strong>{' '}
                  / {emailsTotal.toLocaleString()} ({emailPct}%)
                </>
              )}
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
          <p className="text-[11px] text-slate-400">
            Reset 00:00 (GMT+7) — ngày {resetDate}
          </p>
        </div>

        <PermissionGate permission={PERMISSIONS.BILLING_MANAGE}>
          {onUpgrade && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              onClick={onUpgrade}
            >
              Xem gói cước & hạn ngạch
            </Button>
          )}
        </PermissionGate>
      </CardContent>
    </Card>
  )
}

export default UsageCard
