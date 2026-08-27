import React from 'react'
import { Upload, FileSpreadsheet, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export interface ImportItem {
  id: string
  fileName: string
  totalRows: number
  validRows: number
  targetList: string
  importedAt: string
  status: 'completed' | 'processing' | 'failed'
}

export interface RecentImportCardProps {
  imports?: ImportItem[]
  onViewContacts?: () => void
  className?: string
}

export const RecentImportCard: React.FC<RecentImportCardProps> = ({
  imports,
  onViewContacts,
  className,
}) => {
  const defaultImports: ImportItem[] = [
    {
      id: 'imp-1',
      fileName: 'customers_q3_enterprise.csv',
      totalRows: 5400,
      validRows: 5382,
      targetList: 'VIP Enterprise Clients',
      importedAt: 'Hôm nay lúc 08:30',
      status: 'completed',
    },
    {
      id: 'imp-2',
      fileName: 'webinar_attendees_august.xlsx',
      totalRows: 1250,
      validRows: 1248,
      targetList: 'Webinar Leads Q3',
      importedAt: 'Hôm qua',
      status: 'completed',
    },
    {
      id: 'imp-3',
      fileName: 'newsletter_subscribers_batch2.csv',
      totalRows: 8900,
      validRows: 8750,
      targetList: 'General Subscribers',
      importedAt: '3 ngày trước',
      status: 'completed',
    },
  ]

  const items = imports || defaultImports

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <CardTitle className="text-base">Lịch Sử Nạp Danh Bạ (Recent CSV Imports)</CardTitle>
        </div>
        {onViewContacts && (
          <Button variant="ghost" size="sm" onClick={onViewContacts} className="text-xs text-blue-600 dark:text-blue-400">
            <span>Xem Danh Bạ</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {items.map((imp) => (
          <div
            key={imp.id}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {imp.fileName}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Đích: <strong className="text-slate-600 dark:text-slate-300">{imp.targetList}</strong> • {imp.importedAt}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                +{imp.validRows.toLocaleString()} contacts
              </div>
              <Badge variant="success" className="text-[10px] py-0 px-1.5 mt-0.5">
                Hoàn tất
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default RecentImportCard
