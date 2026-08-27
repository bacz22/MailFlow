import React from 'react'
import { CheckCircle2, Clock } from 'lucide-react'

export interface CampaignDraftIndicatorProps {
  isDirty: boolean
  lastSavedAt?: string
}

export const CampaignDraftIndicator: React.FC<CampaignDraftIndicatorProps> = ({
  isDirty,
  lastSavedAt = 'Vừa xong',
}) => {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium select-none">
      {isDirty ? (
        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/60">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span>Có thay đổi chưa lưu</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Tự động lưu nháp ({lastSavedAt})</span>
        </span>
      )}
    </div>
  )
}

export default CampaignDraftIndicator
