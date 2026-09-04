import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Check,
  Mail,
  Search,
  ChevronsUpDown,
  ChevronUp,
  X,
} from 'lucide-react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { usePermission, PERMISSIONS } from '../../../permissions'
import { senderService } from '../../../services/sender.service'
import type { VerifiedSender } from '../../../types/sender.types'

export const SAMPLE_SENDERS: VerifiedSender[] = []

export interface SenderSelectorProps {
  selectedSenderId: string
  onSelectSender: (sender: VerifiedSender, markDirty?: boolean) => void
  senders?: VerifiedSender[]
  onNavigateSettings?: () => void
}

export const SenderSelector: React.FC<SenderSelectorProps> = ({
  selectedSenderId,
  onSelectSender,
  senders,
  onNavigateSettings,
}) => {
  const { hasPermission } = usePermission()
  const [loadedSenders, setLoadedSenders] = useState<VerifiedSender[]>(senders ?? [])
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'verified'>('all')

  const onSelectSenderRef = useRef(onSelectSender)
  useEffect(() => {
    onSelectSenderRef.current = onSelectSender
  })

  useEffect(() => {
    if (senders) {
      setLoadedSenders(senders)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const rows = await senderService.list()
        if (!cancelled) setLoadedSenders(rows)
      } catch {
        if (!cancelled) setLoadedSenders([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [senders])

  // Auto-select the sender marked as default (or fallback to the only verified sender)
  useEffect(() => {
    if (selectedSenderId) return
    if (!loadedSenders.length) return

    const defaultSender =
      loadedSenders.find((s) => s.isDefault && s.isVerified) ??
      (loadedSenders.length === 1 && loadedSenders[0].isVerified ? loadedSenders[0] : undefined)

    if (defaultSender) {
      onSelectSenderRef.current(defaultSender, false)
    }
  }, [selectedSenderId, loadedSenders])

  const verifiedSenders = useMemo(() => loadedSenders.filter((s) => s.isVerified), [loadedSenders])
  const selectedSender = useMemo(
    () => loadedSenders.find((s) => s.id === selectedSenderId),
    [loadedSenders, selectedSenderId]
  )

  const filteredSenders = useMemo(() => {
    let list = loadedSenders
    if (filterTab === 'verified') {
      list = list.filter((s) => s.isVerified)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.domain.toLowerCase().includes(q)
      )
    }
    return list
  }, [loadedSenders, filterTab, searchQuery])

  // Limit rendering to first 50 items for instant performance with 1000+ items
  const displaySenders = useMemo(() => filteredSenders.slice(0, 50), [filteredSenders])

  if (loadedSenders.length > 0 && verifiedSenders.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-3 text-xs">
        <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm">Chưa Có Địa Chỉ Người Gửi Đã Xác Thực (Sender)</div>
            <p className="leading-relaxed text-amber-700/90 dark:text-amber-400">
              Để đảm bảo tỷ lệ vào Inbox cao nhất và tuân thủ các quy chuẩn chống giả mạo email của Google & Yahoo, bạn cần xác thực bản ghi DKIM/SPF của tên miền gửi thư.
            </p>
          </div>
        </div>

        {hasPermission(PERMISSIONS.SENDER_READ) && onNavigateSettings && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs bg-white dark:bg-slate-900 border-amber-300 text-amber-900 dark:text-amber-200"
            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            onClick={onNavigateSettings}
          >
            Cấu Hình & Xác Thực Người Gửi Mới
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-blue-600" />
          <span>Chọn Người Gửi (Sender)</span>
          <span className="text-rose-500 ml-0.5">*</span>
        </label>
        <span className="text-[11px] text-slate-400">
          Chỉ người gửi đã xác thực DKIM/SPF mới được phép phát hành
        </span>
      </div>

      {/* COMPACT VIEW: Selected Sender Card (Takes only ~60px, never stretches the page) */}
      {!isExpanded && selectedSender ? (
        <div className="p-3 sm:p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Mail className="w-5 h-5" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                  {selectedSender.name}
                </span>
                {selectedSender.isDefault && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                    Mặc định
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Đã Xác Thực DKIM/SPF</span>
                </span>
              </div>

              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="truncate">{selectedSender.email}</span>
                <span>•</span>
                <span>@{selectedSender.domain}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50"
              rightIcon={<ChevronsUpDown className="w-3.5 h-3.5" />}
              onClick={() => setIsExpanded(true)}
            >
              <span>Thay Đổi</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px] font-mono">
                {loadedSenders.length}
              </span>
            </Button>
          </div>
        </div>
      ) : null}

      {/* EXPANDED VIEW: Search & Fast Filter Panel with fixed max-height (never scrolls the page) */}
      {(isExpanded || !selectedSender) && (
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          {/* Top Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Input
                placeholder={`Tìm kiếm trong ${loadedSenders.length} người gửi (tên, email, tên miền)...`}
                leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus={isExpanded}
                className="text-xs h-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs & Close Button */}
            <div className="flex items-center gap-1.5 shrink-0 justify-between sm:justify-end">
              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Tất cả ({loadedSenders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('verified')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    filterTab === 'verified'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Đã xác minh ({verifiedSenders.length})
                </button>
              </div>

              {selectedSender && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-500 h-8 px-2"
                  onClick={() => {
                    setIsExpanded(false)
                    setSearchQuery('')
                  }}
                  rightIcon={<ChevronUp className="w-3.5 h-3.5" />}
                  title="Thu gọn danh sách"
                >
                  Thu gọn
                </Button>
              )}
            </div>
          </div>

          {/* Scrollable Sender List Container (Strict max-h-64 so it NEVER causes long page scrolling!) */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y-0">
            {displaySenders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1.5">
                <Mail className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
                <div className="font-semibold">Không tìm thấy người gửi phù hợp</div>
                <div className="text-[11px]">Thử tìm kiếm với từ khóa khác hoặc kiểm tra bộ lọc.</div>
              </div>
            ) : (
              displaySenders.map((sender) => {
                const isSelected = selectedSenderId === sender.id
                const isAllowed = sender.isVerified

                return (
                  <div
                    key={sender.id}
                    onClick={() => {
                      if (isAllowed) {
                        onSelectSender(sender, true)
                        setIsExpanded(false)
                        setSearchQuery('')
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs select-none ${
                      !isAllowed
                        ? 'opacity-50 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                        : isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-xs cursor-pointer'
                        : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 bg-white dark:bg-slate-900 cursor-pointer'
                    }`}
                  >
                    {/* Left: Radio indicator & Sender details */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span className="truncate">{sender.name}</span>
                          {sender.isDefault && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-semibold shrink-0">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 truncate">
                          {sender.email}
                        </div>
                      </div>
                    </div>

                    {/* Right: Verification Status Badge */}
                    <div className="shrink-0 flex items-center gap-2 text-[10px]">
                      {sender.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Đã Xác Thực</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-500 font-semibold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Chưa xác thực</span>
                        </span>
                      )}
                      <span className="font-mono text-slate-400 hidden md:inline">@{sender.domain}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Bottom helper note if more than 50 results */}
          {filteredSenders.length > 50 && (
            <div className="text-[11px] text-slate-400 text-center pt-1 border-t border-slate-100 dark:border-slate-800">
              Đang hiển thị 50 / {filteredSenders.length} người gửi. Dùng ô tìm kiếm để lọc nhanh.
            </div>
          )}

          {/* Bottom Panel Actions */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            {hasPermission(PERMISSIONS.SENDER_READ) && onNavigateSettings && (
              <button
                type="button"
                onClick={onNavigateSettings}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Quản lý & cấu hình người gửi trong Cài Đặt</span>
              </button>
            )}

            {selectedSender && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="text-xs ml-auto"
                onClick={() => {
                  setIsExpanded(false)
                  setSearchQuery('')
                }}
              >
                Hoàn Tất
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SenderSelector
