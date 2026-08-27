import React from 'react'
import {
  Calendar,
  Clock,
  Send,
  Globe,
  AlertTriangle,
  Zap,
  Gauge,
  Lock,
} from 'lucide-react'
import { Input } from '../../ui/Input'
import { FormField, FormLabel } from '../../ui/FormGroup'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card'
import { usePermission, PERMISSIONS } from '../../../permissions'
import type { CampaignStep5Schedule } from '../../../types/campaignWizard.types'

export interface CampaignStep5ScheduleFormProps {
  data: CampaignStep5Schedule
  onChange: (data: Partial<CampaignStep5Schedule>) => void
}

const TIMEZONES = [
  { value: 'Asia/Bangkok', label: 'Hà Nội, Bangkok, Jakarta (UTC+07:00)' },
  { value: 'Asia/Singapore', label: 'Singapore, Kuala Lumpur (UTC+08:00)' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Seoul (UTC+09:00)' },
  { value: 'Europe/London', label: 'London, Dublin (UTC+00:00)' },
  { value: 'America/New_York', label: 'New York, EST (UTC-05:00)' },
]

export const CampaignStep5ScheduleForm: React.FC<CampaignStep5ScheduleFormProps> = ({
  data,
  onChange,
}) => {
  const { hasPermission } = usePermission()
  const canDirectSend = hasPermission(PERMISSIONS.CAMPAIGN_SEND)

  // Default date/time if not yet set
  const todayStr = new Date().toISOString().split('T')[0]
  const scheduledDate = data.scheduledDate || todayStr
  const scheduledTime = data.scheduledTime || '20:00'

  // Validate if scheduled time is in the past
  const isPastTime = () => {
    if (data.sendType !== 'scheduled') return false
    const target = new Date(`${scheduledDate}T${scheduledTime}`)
    return target.getTime() < Date.now()
  }

  const hasPastError = isPastTime()

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* 1. DISPATCH MODE SELECTION */}
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
          {/* Permission Notice if user is Campaign Editor without Direct Send */}
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

          {/* Mode Option Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* OPTION 1: SEND NOW */}
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

            {/* OPTION 2: SCHEDULE FOR LATER */}
            <div
              onClick={() => onChange({ sendType: 'scheduled' })}
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

          {/* DATETIME PICKER SECTION (When Schedule is Selected) */}
          {data.sendType === 'scheduled' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date Picker */}
                <FormField>
                  <FormLabel required>Ngày Phát Hành</FormLabel>
                  <Input
                    type="date"
                    min={todayStr}
                    value={scheduledDate}
                    onChange={(e) => onChange({ scheduledDate: e.target.value })}
                  />
                </FormField>

                {/* Time Picker */}
                <FormField>
                  <FormLabel required>Giờ Phát Hành (24h)</FormLabel>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => onChange({ scheduledTime: e.target.value })}
                  />
                </FormField>

                {/* Timezone Selector */}
                <FormField>
                  <FormLabel>Múi Giờ (Timezone)</FormLabel>
                  <select
                    defaultValue="Asia/Bangkok"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus-ring cursor-pointer"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Schedule Summary Banner */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-semibold">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Thời điểm gửi dự kiến:</span>
                  <strong className="font-mono text-blue-600 dark:text-blue-400">
                    {scheduledTime}, {scheduledDate} (Asia/Bangkok - UTC+07:00)
                  </strong>
                </div>
              </div>

              {/* Past time error alert */}
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

      {/* 2. DISPATCH SPEED & IP WARMUP THROTTLE */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-base">Tốc Độ Phân Phối Email (Delivery Throttle)</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Điều tiết lưu lượng gửi theo phút để bảo vệ danh tiếng IP và tránh vượt ngưỡng rate-limit của nhà cung cấp hòm thư.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'fast',
                title: 'Tốc Độ Tối Đa',
                rate: '~10,000 email/phút',
                desc: 'Phù hợp flash sale hoặc thông báo gấp với tên miền có uy tín cao.',
              },
              {
                id: 'normal',
                title: 'Tiêu Chuẩn (Khuyên dùng)',
                rate: '~2,500 email/phút',
                desc: 'Tối ưu độ ổn định tỷ lệ vào Inbox cho Gmail, Outlook và Yahoo.',
              },
              {
                id: 'warmup',
                title: 'Làm Ấm IP (Warmup Safe)',
                rate: '~500 email/phút',
                desc: 'Khuyến nghị cho tên miền gửi mới hoặc sau khi thêm Dedicated IP mới.',
              },
            ].map((speed) => {
              const isSelected = (data.batchSpeed || 'fast') === speed.id

              return (
                <div
                  key={speed.id}
                  onClick={() => onChange({ batchSpeed: speed.id as 'normal' | 'fast' | 'warmup' })}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 text-xs cursor-pointer select-none ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                      <span>{speed.title}</span>
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">{speed.rate}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{speed.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CampaignStep5ScheduleForm
