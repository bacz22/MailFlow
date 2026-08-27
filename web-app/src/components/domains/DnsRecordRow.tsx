import React, { useState } from 'react'
import { Copy, Check, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { Badge } from '../ui/Badge'
import type { DnsRecord } from '../../types/domain.types'

export interface DnsRecordRowProps {
  record: DnsRecord
}

export const DnsRecordRow: React.FC<DnsRecordRowProps> = ({ record }) => {
  const [copiedHost, setCopiedHost] = useState(false)
  const [copiedValue, setCopiedValue] = useState(false)

  const handleCopyHost = () => {
    navigator.clipboard.writeText(record.host)
    setCopiedHost(true)
    setTimeout(() => setCopiedHost(false), 1500)
  }

  const handleCopyValue = () => {
    navigator.clipboard.writeText(record.value)
    setCopiedValue(true)
    setTimeout(() => setCopiedValue(false), 1500)
  }

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition text-xs">
      {/* Purpose & Type */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="font-mono font-extrabold text-[10px]">
            {record.type}
          </Badge>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {record.purpose}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5 max-w-[140px] truncate" title={record.description}>
          {record.description}
        </div>
      </td>

      {/* Host / Name */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg max-w-xs justify-between group">
          <span className="truncate">{record.host}</span>
          <button
            type="button"
            onClick={handleCopyHost}
            aria-label="Sao chép tên Host"
            className="text-slate-400 hover:text-blue-600 transition shrink-0 cursor-pointer p-0.5"
            title="Sao chép tên Host"
          >
            {copiedHost ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </td>

      {/* Record Value */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg justify-between group max-w-md">
          <span className="truncate" title={record.value}>{record.value}</span>
          <button
            type="button"
            onClick={handleCopyValue}
            aria-label="Sao chép giá trị bản ghi"
            className="text-slate-400 hover:text-blue-600 transition shrink-0 cursor-pointer p-0.5 flex items-center gap-1 text-[10px] font-bold"
            title="Sao chép giá trị bản ghi"
          >
            {copiedValue ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép</span>
              </>
            )}
          </button>
        </div>
      </td>

      {/* Verification Status */}
      <td className="py-3 px-4 text-center">
        {record.status === 'VERIFIED' ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã Khớp</span>
          </span>
        ) : record.status === 'PENDING' ? (
          <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Chờ DNS</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px] px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Chưa Tìm Thấy</span>
          </span>
        )}
      </td>
    </tr>
  )
}

export default DnsRecordRow
