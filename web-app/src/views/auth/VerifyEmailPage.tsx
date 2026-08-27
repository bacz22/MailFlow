import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Mail,
  ArrowRight,
  Send,
  KeyRound,
} from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { authService } from '../../services/auth.service'
import { ApiError } from '../../services/apiClient'

export type VerifyEmailState = 'awaiting' | 'verifying' | 'verified' | 'expired' | 'failed'

export interface VerifyEmailPageProps {
  initialState?: VerifyEmailState
  userEmail?: string
  onNavigate?: (path: string) => void
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  userEmail: initialUserEmail,
  onNavigate,
}) => {
  const { showToast } = useToast()

  // Đọc token và email từ query parameters (?token=...&email=...)
  const urlParams = new URLSearchParams(window.location.search)
  const tokenFromUrl = urlParams.get('token')
  const emailFromUrl = urlParams.get('email')

  const [email, setEmail] = useState<string>(
    emailFromUrl || initialUserEmail || 'bacnguyen3476@gmail.com'
  )
  const [manualToken, setManualToken] = useState<string>(tokenFromUrl || '')
  const [state, setState] = useState<VerifyEmailState>(tokenFromUrl ? 'verifying' : 'awaiting')
  const [countdown, setCountdown] = useState<number>(0)
  const [isResending, setIsResending] = useState<boolean>(false)
  const [isVerifyingManual, setIsVerifyingManual] = useState<boolean>(false)

  const hasExecutedRef = useRef(false)

  // Hàm gọi API xác thực token
  const handleVerifyToken = useCallback(
    async (tokenToVerify: string) => {
      if (!tokenToVerify.trim()) return

      setState('verifying')
      try {
        const response = await authService.verifyEmail(tokenToVerify)
        if (response.email) {
          setEmail(response.email)
        }
        setState('verified')
        showToast({
          type: 'success',
          title: 'Xác thực thành công',
          description: response.message || 'Tài khoản của bạn đã được kích hoạt thành công.',
        })
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          if (err.code === 'TOKEN_EXPIRED') {
            setState('expired')
            showToast({
              type: 'warning',
              title: 'Liên kết hết hạn',
              description: err.detail || 'Mã xác thực đã hết thời gian hiệu lực 24 giờ.',
            })
          } else {
            setState('failed')
            showToast({
              type: 'error',
              title: 'Xác thực không hợp lệ',
              description: err.detail || 'Mã bảo mật không đúng hoặc đã được dùng trước đây.',
            })
          }
        } else {
          setState('failed')
          showToast({
            type: 'error',
            title: 'Lỗi kết nối',
            description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
          })
        }
      }
    },
    [showToast]
  )

  // Tự động kích hoạt khi có token trong URL
  useEffect(() => {
    if (tokenFromUrl && !hasExecutedRef.current) {
      hasExecutedRef.current = true
      handleVerifyToken(tokenFromUrl)
    }
  }, [tokenFromUrl, handleVerifyToken])

  // Đếm ngược 60s gửi lại email
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Xử lý gửi lại email xác thực
  const handleResendEmail = async () => {
    if (countdown > 0 || isResending) return
    if (!email.trim()) {
      showToast({
        type: 'error',
        title: 'Chưa có email',
        description: 'Vui lòng nhập địa chỉ email để gửi lại mã xác thực.',
      })
      return
    }

    setIsResending(true)
    try {
      const response = await authService.resendVerification(email)
      setCountdown(60)
      showToast({
        type: 'info',
        title: 'Đã gửi mã xác thực mới',
        description: response.message || `Đã gửi liên kết xác thực mới tới ${email}.`,
      })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        showToast({
          type: 'error',
          title: 'Gửi lại thất bại',
          description: err.detail || err.message,
        })
      } else {
        showToast({
          type: 'error',
          title: 'Lỗi kết nối',
          description: 'Không thể kết nối đến máy chủ.',
        })
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout
      title="Xác Thực Địa Chỉ Email"
      subtitle={
        state === 'awaiting'
          ? 'Kiểm tra hộp thư đến của bạn để kích hoạt tài khoản'
          : state === 'verifying'
          ? 'Đang kiểm tra và xác thực mã kích hoạt tài khoản của bạn...'
          : state === 'verified'
          ? 'Tài khoản của bạn đã được xác thực thành công!'
          : state === 'expired'
          ? 'Liên kết xác thực đã hết hạn (chỉ có hiệu lực trong 24 giờ).'
          : 'Không thể xác thực mã kích hoạt hoặc liên kết không hợp lệ.'
      }
    >
      <div className="space-y-6 text-center animate-in fade-in-0">
        {/* 1. STATE: AWAITING (Vừa đăng ký xong, chờ check mail) */}
        {state === 'awaiting' && (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto shadow-md">
              <Mail className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Kiểm Tra Hộp Thư Của Bạn
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Chúng tôi đã gửi liên kết xác thực tới địa chỉ email:{' '}
                <strong className="font-mono text-blue-600 dark:text-blue-400">{email}</strong>.
                Vui lòng kiểm tra hộp thư đến (hoặc mục Spam) để kích hoạt tài khoản.
              </p>
            </div>

            {/* Khung nhập token thủ công (tiện test khi dev) */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-left space-y-2">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                Hoặc nhập mã Token xác thực trực tiếp:
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder="Dán mã token tại đây..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="text-xs font-mono w-full"
                  />
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="shrink-0 px-3.5 font-semibold text-xs h-[38px]"
                  isLoading={isVerifyingManual}
                  onClick={async () => {
                    if (!manualToken.trim()) return
                    setIsVerifyingManual(true)
                    await handleVerifyToken(manualToken)
                    setIsVerifyingManual(false)
                  }}
                >
                  Xác Thực
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="outline"
                size="md"
                className="w-full justify-center text-xs font-semibold"
                onClick={handleResendEmail}
                disabled={countdown > 0 || isResending}
                isLoading={isResending}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                {countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Chưa nhận được? Gửi lại email'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => onNavigate?.('/login')}
              >
                Quay lại trang Đăng nhập
              </Button>
            </div>
          </div>
        )}

        {/* 2. STATE: VERIFYING */}
        {state === 'verifying' && (
          <div className="space-y-4 py-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto shadow-md">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Đang Xác Thực Tài Khoản...
              </h3>
              <p className="text-xs text-slate-500">
                Vui lòng giữ nguyên cửa sổ trình duyệt trong giây lát.
              </p>
            </div>
          </div>
        )}

        {/* 3. STATE: VERIFIED SUCCESS */}
        {state === 'verified' && (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Kích Hoạt Tài Khoản Thành Công
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Địa chỉ email <strong className="font-mono text-blue-600 dark:text-blue-400">{email}</strong> đã được xác minh. Không gian làm việc MailFlow của bạn đã sẵn sàng sử dụng.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center font-bold shadow-md shadow-blue-600/20"
                onClick={() => onNavigate?.('/login')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Tiếp Tục Đăng Nhập
              </Button>
            </div>
          </div>
        )}

        {/* 4. STATE: EXPIRED LINK */}
        {state === 'expired' && (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-md">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Liên Kết Đã Hết Hạn
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Mã xác thực gửi đến <strong className="font-mono text-slate-700 dark:text-slate-300">{email}</strong> đã hết thời gian hiệu lực (24 giờ).
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center font-bold"
                onClick={handleResendEmail}
                disabled={countdown > 0 || isResending}
                isLoading={isResending}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                {countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại email xác thực mới'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => onNavigate?.('/login')}
              >
                Quay lại trang Đăng nhập
              </Button>
            </div>
          </div>
        )}

        {/* 5. STATE: FAILED / INVALID TOKEN */}
        {state === 'failed' && (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto shadow-md">
              <XCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Xác Thực Không Hợp Lệ
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Mã bảo mật không đúng hoặc liên kết xác thực đã từng được sử dụng trước đây.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="outline"
                size="md"
                className="w-full justify-center"
                onClick={handleResendEmail}
                disabled={countdown > 0 || isResending}
                isLoading={isResending}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                {countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại email xác thực'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => onNavigate?.('/login')}
              >
                Quay lại trang Đăng nhập
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

export default VerifyEmailPage
