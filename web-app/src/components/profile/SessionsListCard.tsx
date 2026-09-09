import React, { useState, useEffect } from 'react'
import {
  Laptop,
  Smartphone,
  LogOut,
  ShieldAlert,
  Loader2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/Dialog'
import { useToast } from '../ui/Toast'
import type { UserSession } from '../../types/profile.types'
import { authService } from '../../services/auth.service'

function formatSessionIp(ip: string | null | undefined): string {
  if (!ip || !ip.trim()) {
    return 'Không xác định'
  }
  const value = ip.trim()
  if (
    value === '::1' ||
    value === '0:0:0:0:0:0:0:1' ||
    value.toLowerCase() === 'https://example.net/id/garnet'
  ) {
    return '127.0.0.1'
  }
  return value
}

const DEFAULT_SESSIONS: UserSession[] = [
  {
    id: 'sess-current',
    device: 'Thiết Bị Này',
    browser: 'Trình duyệt hiện tại',
    os: 'Hệ điều hành',
    location: 'Việt Nam',
    ipAddress: '127.0.0.1',
    lastActive: 'Đang hoạt động (Hiện tại)',
    isCurrent: true,
  },
]

export const SessionsListCard: React.FC = () => {
  const { showToast } = useToast()
  const [sessions, setSessions] = useState<UserSession[]>(DEFAULT_SESSIONS)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false)

  const fetchSessions = async () => {
    try {
      const data = await authService.getSessions()
      if (data && Array.isArray(data) && data.length > 0) {
        setSessions(
          data.map((s) => {
            const isCurrent = !!(s.isCurrent ?? s.current)
            return {
              id: s.id,
              device: isCurrent ? 'Thiết Bị Này' : s.device || 'Máy tính / Thiết bị',
              browser: s.browser || 'Trình duyệt Web',
              os: s.operatingSystem || 'Hệ điều hành',
              location: 'Việt Nam',
              ipAddress: formatSessionIp(s.ipAddress),
              lastActive: isCurrent
                ? 'Đang hoạt động (Hiện tại)'
                : new Date(s.lastActiveAt).toLocaleString('vi-VN'),
              isCurrent,
            }
          })
        )
      }
    } catch {
      // Fallback giữ nguyên session hiện tại nếu lỗi kết nối
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length

  const handleLogoutOthers = async () => {
    setIsLoggingOutOthers(true)
    try {
      const otherSessions = sessions.filter((s) => !s.isCurrent)
      for (const s of otherSessions) {
        await authService.revokeSession(s.id)
      }
      setSessions((prev) => prev.filter((s) => s.isCurrent))
      setIsConfirmOpen(false)
      showToast({
        type: 'success',
        title: 'Đã đăng xuất khỏi các thiết bị khác',
        description: 'Tất cả các phiên làm việc trên các thiết bị khác đã bị vô hiệu hóa an toàn.',
      })
    } catch {
      showToast({
        type: 'error',
        title: 'Lỗi',
        description: 'Không thể đăng xuất tất cả các thiết bị khác.',
      })
    } finally {
      setIsLoggingOutOthers(false)
    }
  }

  const handleLogoutSingleSession = async (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId)
    if (!target || target.isCurrent) {
      return
    }
    try {
      await authService.revokeSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      showToast({
        type: 'success',
        title: 'Đã đóng phiên làm việc',
        description: 'Thiết bị đã được đăng xuất thành công.',
      })
    } catch {
      showToast({
        type: 'error',
        title: 'Lỗi thu hồi',
        description: 'Không thể đăng xuất phiên làm việc.',
      })
    }
  }

  return (
    <Card className="border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm">Phiên Đăng Nhập & Thiết Bị Hoạt Động</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Quản lý các thiết bị và trình duyệt đang duy trì đăng nhập vào tài khoản của bạn.
          </CardDescription>
        </div>

        {otherSessionsCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 text-xs shrink-0"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
            onClick={() => setIsConfirmOpen(true)}
          >
            Đăng Xuất Các Thiết Bị Khác ({otherSessionsCount})
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-5 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        {isLoading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Đang tải danh sách phiên đăng nhập...</span>
          </div>
        ) : (
          sessions.map((sess) => (
            <div
              key={sess.id}
              className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    sess.isCurrent
                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 border-blue-200 dark:border-blue-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {sess.device.includes('iPhone') || sess.device.includes('Mobile') || sess.device.includes('Android') ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Laptop className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {sess.device}
                    </span>
                    {sess.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        Thiết Bị Này
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
                    <span>{sess.browser} • {sess.os}</span>
                    <span>• {sess.location}</span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                    {sess.lastActive}
                  </div>
                </div>
              </div>

              {/* Action button */}
              {!sess.isCurrent && (
                <div className="sm:self-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 text-xs h-7 px-2.5"
                    onClick={() => handleLogoutSingleSession(sess.id)}
                  >
                    Đăng Xuất
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={() => setIsConfirmOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
              <DialogTitle>Đăng Xuất Khỏi Tất Cả Thiết Bị Khác?</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Bạn sẽ bị đăng xuất khỏi tất cả {otherSessionsCount} thiết bị và trình duyệt khác đang mở.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="text-[11px] leading-relaxed">
              Phiên làm việc trên thiết bị hiện tại sẽ vẫn được duy trì an toàn.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsConfirmOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 font-bold"
              isLoading={isLoggingOutOthers}
              onClick={handleLogoutOthers}
            >
              Xác Nhận Đăng Xuất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default SessionsListCard
