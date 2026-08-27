import React from 'react'
import { CheckCircle2, XCircle, Send, ShieldCheck } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card'
import { Badge } from '../../ui/Badge'

export interface ApprovalLogEntry {
  id: string
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED'
  actor: string
  actorRole: string
  timestamp: string
  note?: string
}

export interface ApprovalHistoryProps {
  logs: ApprovalLogEntry[]
}

export const ApprovalHistory: React.FC<ApprovalHistoryProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        Chưa có lịch sử phê duyệt cho chiến dịch này.
      </div>
    )
  }

  return (
    <Card className="animate-in fade-in-0">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <CardTitle className="text-sm">Nhật Ký Phê Duyệt & Kiểm Duyệt Nội Dung</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Chi tiết các lần gửi duyệt, ý kiến đánh giá và quyết định phê duyệt của ban quản trị.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {logs.map((log) => {
            const isApproved = log.action === 'APPROVED'
            const isRejected = log.action === 'REJECTED'
            const isSubmitted = log.action === 'SUBMITTED' || log.action === 'RESUBMITTED'

            return (
              <div key={log.id} className="relative text-xs space-y-1">
                {/* Node icon */}
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border shadow-xs ${
                    isApproved
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border-emerald-300'
                      : isRejected
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 border-rose-300'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-600 border-blue-300'
                  }`}
                >
                  {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {isRejected && <XCircle className="w-3.5 h-3.5" />}
                  {isSubmitted && <Send className="w-3 h-3" />}
                </div>

                <div className="flex items-center justify-between gap-2 pl-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {isApproved
                        ? 'Phê duyệt chiến dịch'
                        : isRejected
                        ? 'Từ chối yêu cầu phê duyệt'
                        : log.action === 'RESUBMITTED'
                        ? 'Gửi duyệt lại (Resubmitted)'
                        : 'Gửi yêu cầu phê duyệt'}
                    </span>
                    <Badge
                      variant={isApproved ? 'success' : isRejected ? 'danger' : 'info'}
                      className="text-[10px]"
                    >
                      {log.action}
                    </Badge>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">{log.timestamp}</span>
                </div>

                <div className="text-[11px] text-slate-500 pl-2">
                  Thực hiện bởi: <strong className="text-slate-700 dark:text-slate-300">{log.actor}</strong> ({log.actorRole})
                </div>

                {log.note && (
                  <div
                    className={`p-2.5 rounded-xl text-[11px] mt-1 ml-2 border leading-relaxed ${
                      isRejected
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                        : isApproved
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {log.note}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default ApprovalHistory
