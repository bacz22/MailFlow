import React, { useState } from 'react'
import {
  Laptop,
  Smartphone,
  LogOut,
  ShieldAlert,
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

const INITIAL_SESSIONS: UserSession[] = [
  {
    id: 'sess-1',
    device: 'Máy Tính Để Bàn (Windows PC)',
    browser: 'Chrome 128.0',
    os: 'Windows 11 Pro',
    location: 'Hà Nội, Việt Nam',
    ipAddress: '113.190.234.12',
    lastActive: 'Đang hoạt động (Hiện tại)',
    isCurrent: true,
  },
  {
    id: 'sess-2',
    device: 'MacBook Pro 16"',
    browser: 'Safari 17.4',
    os: 'macOS Sonoma',
    location: 'TP. Hồ Chí Minh, Việt Nam',
    ipAddress: '14.161.45.88',
    lastActive: '2 giờ trước',
    isCurrent: false,
  },
  {
    id: 'sess-3',
    device: 'iPhone 15 Pro Max',
    browser: 'MailFlow Mobile iOS App',
    os: 'iOS 17.5',
    location: 'Hà Nội, Việt Nam',
    ipAddress: '113.190.234.12',
    lastActive: 'Hôm qua lúc 19:40',
    isCurrent: false,
  },
]

export const SessionsListCard: React.FC = () => {
  const { showToast } = useToast()
  const [sessions, setSessions] = useState<UserSession[]>(INITIAL_SESSIONS)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false)

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length

  const handleLogoutOthers = async () => {
    setIsLoggingOutOthers(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsLoggingOutOthers(false)
    setSessions((prev) => prev.filter((s) => s.isCurrent))
    setIsConfirmOpen(false)
    showToast({
      type: 'success',
      title: 'Đã đăng xuất khỏi các thiết bị khác',
      description: 'Tất cả các phiên làm việc trên các thiết bị khác đã bị vô hiệu hóa an toàn.',
    })
  }

  const handleLogoutSingleSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    showToast({
      type: 'success',
      title: 'Đã đóng phiên làm việc',
      description: 'Thiết bị đã được đăng xuất thành công.',
    })
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
        {sessions.map((sess) => (
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
                {sess.device.includes('iPhone') || sess.device.includes('Mobile') ? (
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

                <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                  <span>{sess.browser} • {sess.os}</span>
                  <span>• {sess.location}</span>
                  <span className="font-mono">({sess.ipAddress})</span>
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
        ))}
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
