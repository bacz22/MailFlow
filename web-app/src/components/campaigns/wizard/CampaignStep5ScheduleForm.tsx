import React from 'react'
import {
  Calendar,
  Clock,
  Send,
  Globe,
  AlertTriangle,
  Zap,
  Lock,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card'
import { SimpleSelect } from '../../ui/Select'
import { DatePicker, TimePicker } from '../../ui/DatePicker'
import { usePermission, PERMISSIONS } from '../../../permissions'
import type { CampaignStep5Schedule } from '../../../types/campaignWizard.types'

export interface CampaignStep5ScheduleFormProps {
  data: CampaignStep5Schedule
  onChange: (data: Partial<CampaignStep5Schedule>) => void
}

const TIMEZONES = [
  { value: 'Asia/Bangkok', label: 'Hà Nội, Bangkok, Jakarta (UTC+07:00)', short: 'UTC+07:00' },
  { value: 'Asia/Singapore', label: 'Singapore, Kuala Lumpur (UTC+08:00)', short: 'UTC+08:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Seoul (UTC+09:00)', short: 'UTC+09:00' },
  { value: 'Europe/London', label: 'London, Dublin (UTC+00:00)', short: 'UTC+00:00' },
  { value: 'America/New_York', label: 'New York (UTC−05:00)', short: 'UTC−05:00' },
]

function formatDateVn(iso?: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

export const CampaignStep5ScheduleForm: React.FC<CampaignStep5ScheduleFormProps> = ({
  data,
  onChange,
}) => {
  const { hasPermission } = usePermission()
  const canDirectSend = hasPermission(PERMISSIONS.CAMPAIGN_SEND)

  const todayStr = new Date().toISOString().split('T')[0]
  const scheduledDate = data.scheduledDate || todayStr
  const scheduledTime = data.scheduledTime || '20:00'
  const timezone = data.timezone || 'Asia/Bangkok'
  const timezoneMeta = TIMEZONES.find((tz) => tz.value === timezone) || TIMEZONES[0]

  const isPastTime = () => {
    if (data.sendType !== 'scheduled') return false
    const target = new Date(`${scheduledDate}T${scheduledTime}`)
    return target.getTime() < Date.now()
  }

  const hasPastError = isPastTime()

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <CardTitle className="text-base">Thời Điểm Phát Hành Chiến Dịch</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Lựa chọn gửi chiến dịch ngay khi hoàn tất duyệt hoặc lên lịch tự động phát hành trong tương lai.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          {!canDirectSend && (
            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Quyền Hạn Soạn Thảo (Campaign Editor):</span>
                <p className="text-blue-700/80 dark:text-blue-300 text-[11px] leading-relaxed">
                  Tài khoản của bạn có quyền thiết lập thông tin và lên lịch. Sau khi hoàn thành, chiến dịch sẽ được gửi vào quy trình <strong>Yêu Cầu Phê Duyệt (Submit for Approval)</strong> để Quản trị viên/Admin phê duyệt trước khi phát hành.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => {
                if (canDirectSend) {
                  onChange({ sendType: 'immediate' })
                }
              }}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 text-xs select-none ${
                !canDirectSend
                  ? 'opacity-60 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                  : data.sendType === 'immediate'
                  ? 'border-amber-600 bg-amber-50/40 dark:bg-amber-950/20 ring-2 ring-amber-500/20 shadow-xs cursor-pointer'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900 cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-amber-600" />
                    <span>Phát Hành Ngay (Send Now)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Chiến dịch sẽ được đưa ngay vào hàng đợi gửi (Queue) sau khi xác nhận ở Bước 6.
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                    data.sendType === 'immediate'
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  {data.sendType === 'immediate' && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Bắt đầu gửi trong vòng ~30 giây</span>
              </div>
            </div>

            <div
              onClick={() =>
                onChange({
                  sendType: 'scheduled',
                  scheduledDate: data.scheduledDate || todayStr,
                  scheduledTime: data.scheduledTime || '20:00',
                  timezone: data.timezone || 'Asia/Bangkok',
                })
              }
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 text-xs cursor-pointer select-none ${
                data.sendType === 'scheduled'
                  ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Lên Lịch Tự Động (Schedule for Later)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Hệ thống sẽ tự động kích hoạt tiến trình gửi vào đúng ngày, giờ và múi giờ đã chọn.
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                    data.sendType === 'scheduled'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  {data.sendType === 'scheduled' && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-blue-600 font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Chính xác theo múi giờ chỉ định</span>
              </div>
            </div>
          </div>

          {data.sendType === 'scheduled' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-end">
                <div className="flex flex-col gap-1.5 w-full min-w-0">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 h-5 leading-5">
                    Ngày Phát Hành<span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <DatePicker
                    size="md"
                    value={scheduledDate}
                    minDate={todayStr}
                    hasError={hasPastError}
                    onChange={(date) =>
                      onChange({
                        scheduledDate: date,
                        scheduledTime: data.scheduledTime || scheduledTime,
                        timezone: data.timezone || timezone,
                      })
                    }
                    placeholder="Chọn ngày gửi..."
                    className="w-full !h-[38px] box-border"
                  />
                </div>

                <div className="flex flex-col gap-1.5 w-full min-w-0">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 h-5 leading-5">
                    Giờ Phát Hành (24h)<span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <TimePicker
                    size="md"
                    value={scheduledTime}
                    hasError={hasPastError}
                    onChange={(time) =>
                      onChange({
                        scheduledTime: time,
                        scheduledDate: data.scheduledDate || scheduledDate,
                        timezone: data.timezone || timezone,
                      })
                    }
                    placeholder="Chọn giờ gửi..."
                    className="w-full !h-[38px] box-border"
                  />
                </div>

                <div className="flex flex-col gap-1.5 w-full min-w-0">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 h-5 leading-5">
                    Múi Giờ
                  </label>
                  <SimpleSelect
                    size="md"
                    value={timezone}
                    onValueChange={(value) => onChange({ timezone: value })}
                    placeholder="Chọn múi giờ..."
                    options={TIMEZONES.map((tz) => ({
                      value: tz.value,
                      label: `${tz.label.split(' (')[0]} ${tz.short}`,
                      textValue: tz.label,
                    }))}
                    className="w-full !h-[38px] box-border"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-semibold min-w-0">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="shrink-0">Thời điểm gửi dự kiến:</span>
                  <strong className="font-mono text-blue-600 dark:text-blue-400">
                    {scheduledTime} · {formatDateVn(scheduledDate)} ({timezoneMeta.short})
                  </strong>
                </div>
              </div>

              {hasPastError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Thời điểm hẹn giờ không thể ở trong quá khứ. Vui lòng chọn ngày/giờ tương lai.</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CampaignStep5ScheduleForm
