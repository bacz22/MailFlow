import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, X, CheckCircle2, ArrowRight, AlertTriangle, XCircle } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { resetPasswordSchema, evaluatePasswordStrength } from '../../schemas/auth.schemas'
import type { ResetPasswordFormData } from '../../schemas/auth.schemas'
import { Button } from '../../components/ui/Button'
import { PasswordInput } from '../../components/ui/Input'
import { FormField, FormLabel, FormMessage } from '../../components/ui/FormGroup'
import { useToast } from '../../components/ui/Toast'
import { authService } from '../../services/auth.service'
import { ApiError } from '../../services/apiClient'

export type ResetPasswordState = 'form' | 'success' | 'expired' | 'invalid'

export interface ResetPasswordPageProps {
  onNavigate?: (path: string) => void
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const tokenFromUrl = new URLSearchParams(window.location.search).get('token')?.trim() || ''
  const [state, setState] = useState<ResetPasswordState>(tokenFromUrl ? 'form' : 'invalid')
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const passwordVal = watch('password') || ''
  const strength = evaluatePasswordStrength(passwordVal)

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!tokenFromUrl) {
      setState('invalid')
      return
    }
    setServerError(null)
    try {
      const response = await authService.resetPassword(tokenFromUrl, data.password, data.confirmPassword)
      setState('success')
      showToast({
        type: 'success',
        title: 'Mật khẩu đã thay đổi',
        description: response.message || 'Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.',
      })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'TOKEN_EXPIRED') {
          setState('expired')
          showToast({
            type: 'warning',
            title: 'Liên kết hết hạn',
            description: err.detail || 'Liên kết đặt lại mật khẩu đã hết hạn (1 giờ).',
          })
          return
        }
        if (err.code === 'INVALID_TOKEN') {
          setState('invalid')
          showToast({
            type: 'error',
            title: 'Liên kết không hợp lệ',
            description: err.detail || 'Liên kết đặt lại mật khẩu không đúng hoặc đã được dùng.',
          })
          return
        }
        if (err.code === 'NEW_PASSWORD_SAME_AS_OLD') {
          setError('password', { message: err.detail || 'Mật khẩu mới không được trùng với mật khẩu cũ.' })
          return
        }
        if (err.code === 'PASSWORD_MISMATCH') {
          setError('confirmPassword', { message: err.detail || 'Mật khẩu xác nhận không khớp.' })
          return
        }
        setServerError(err.detail || err.message)
        showToast({
          type: 'error',
          title: err.code === 'RATE_LIMITED' ? 'Quá nhiều yêu cầu' : 'Đặt lại mật khẩu thất bại',
          description: err.detail || err.message,
        })
      } else {
        setServerError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.')
        showToast({
          type: 'error',
          title: 'Lỗi kết nối',
          description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
        })
      }
    }
  }

  const subtitle =
    state === 'success'
      ? 'Mật khẩu của bạn đã được cập nhật an toàn.'
      : state === 'expired'
        ? 'Liên kết đặt lại mật khẩu đã hết hạn (chỉ có hiệu lực trong 1 giờ).'
        : state === 'invalid'
          ? 'Liên kết không hợp lệ hoặc thiếu mã bảo mật.'
          : 'Tạo mật khẩu mới mạnh mẽ để bảo vệ tài khoản MailFlow của bạn.'

  return (
    <AuthLayout title="Đặt Lại Mật Khẩu Mới" subtitle={subtitle}>
      {state === 'form' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField>
            <FormLabel required>Mật khẩu mới</FormLabel>
            <PasswordInput
              placeholder="Tối thiểu 8 ký tự, gồm số và ký tự đặc biệt"
              hasError={!!errors.password}
              {...register('password')}
            />
            {errors.password && <FormMessage error={errors.password.message} />}
          </FormField>

          {passwordVal.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs animate-in fade-in-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px] text-slate-600 dark:text-slate-300">
                  Độ mạnh mật khẩu:
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded font-mono ${
                    strength.score === 4
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : strength.score >= 2
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {strength.score === 4 ? 'Rất Mạnh' : strength.score >= 2 ? 'Trung Bình' : 'Yếu'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full transition-colors ${
                      strength.score >= step
                        ? strength.score === 4
                          ? 'bg-emerald-500'
                          : strength.score >= 2
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
                {strength.criteria.map((crit, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 ${
                      crit.met ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {crit.met ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
                    <span>{crit.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FormField>
            <FormLabel required>Xác nhận lại mật khẩu</FormLabel>
            <PasswordInput
              placeholder="Nhập lại mật khẩu"
              hasError={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <FormMessage error={errors.confirmPassword.message} />}
          </FormField>

          {serverError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 text-center">{serverError}</p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center text-sm font-bold shadow-md shadow-blue-600/20"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Cập Nhật Mật Khẩu
            </Button>
          </div>
        </form>
      )}

      {state === 'success' && (
        <div className="space-y-5 text-center animate-in fade-in-0">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-md">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Đổi Mật Khẩu Thành Công!
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Mật khẩu mới của bạn đã có hiệu lực. Các phiên đăng nhập cũ đã được đăng xuất.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full justify-center font-bold"
              onClick={() => onNavigate?.('/login')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Đăng Nhập Ngay
            </Button>
          </div>
        </div>
      )}

      {state === 'expired' && (
        <div className="space-y-5 text-center animate-in fade-in-0">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-md">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Liên Kết Đã Hết Hạn</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Liên kết đặt lại mật khẩu chỉ có hiệu lực trong 1 giờ. Vui lòng yêu cầu liên kết mới.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full justify-center font-bold"
              onClick={() => onNavigate?.('/forgot-password')}
            >
              Gửi lại liên kết mới
            </Button>
            <Button
              type="button"
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

      {state === 'invalid' && (
        <div className="space-y-5 text-center animate-in fade-in-0">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto shadow-md">
            <XCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Liên Kết Không Hợp Lệ</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Liên kết đặt lại mật khẩu không đúng, đã được sử dụng, hoặc thiếu mã bảo mật.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full justify-center font-bold"
              onClick={() => onNavigate?.('/forgot-password')}
            >
              Yêu cầu liên kết mới
            </Button>
            <Button
              type="button"
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
    </AuthLayout>
  )
}

export default ResetPasswordPage
