import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, CheckCircle2, RefreshCw, Send } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { forgotPasswordSchema } from '../../schemas/auth.schemas'
import type { ForgotPasswordFormData } from '../../schemas/auth.schemas'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { FormField, FormLabel, FormMessage } from '../../components/ui/FormGroup'
import { useToast } from '../../components/ui/Toast'

export interface ForgotPasswordPageProps {
  onNavigate?: (path: string) => void
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const onSubmit = async (data: ForgotPasswordFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSubmittedEmail(data.email)
    setCountdown(60)
    showToast({
      type: 'success',
      title: 'Đã gửi email',
      description: `Đã gửi liên kết khôi phục tới ${data.email}.`,
    })
  }

  const handleResend = async () => {
    if (countdown > 0 || !submittedEmail) return
    await new Promise((resolve) => setTimeout(resolve, 600))
    setCountdown(60)
    showToast({
      type: 'info',
      title: 'Đã gửi lại',
      description: `Đã gửi lại email khôi phục mật khẩu.`,
    })
  }

  return (
    <AuthLayout
      title="Khôi Phục Mật Khẩu"
      subtitle={
        submittedEmail
          ? 'Kiểm tra hộp thư đến của bạn để tiếp tục đặt lại mật khẩu.'
          : 'Nhập địa chỉ email đăng ký để nhận liên kết đặt lại mật khẩu.'
      }
    >
      {!submittedEmail ? (
        /* Form State */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField>
            <FormLabel required>Email tài khoản</FormLabel>
            <Input
              type="email"
              placeholder="name@company.com"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              hasError={!!errors.email}
              {...register('email')}
            />
            {errors.email && <FormMessage error={errors.email.message} />}
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center text-sm font-bold shadow-md shadow-blue-600/20"
              isLoading={isSubmitting}
              rightIcon={<Send className="w-4 h-4" />}
            >
              Gửi Liên Kết Đặt Lại Mật Khẩu
            </Button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => onNavigate?.('/login')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang Đăng nhập</span>
            </button>
          </div>
        </form>
      ) : (
        /* Success State */
        <div className="space-y-5 text-center animate-in fade-in-0">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-md">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Đã Gửi Hướng Dẫn Khôi Phục
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Chúng tôi đã gửi một email chứa liên kết bảo mật để đặt lại mật khẩu đến địa chỉ{' '}
              <strong className="font-mono text-blue-600 dark:text-blue-400 font-bold">{submittedEmail}</strong>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 text-left space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">Không nhận được email?</div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
              <li>Kiểm tra kỹ trong hòm thư Spam hoặc Thư rác.</li>
              <li>Đảm bảo địa chỉ email đã được nhập chính xác.</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full justify-center text-xs"
              onClick={handleResend}
              disabled={countdown > 0}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${countdown > 0 ? '' : 'text-blue-600'}`} />}
            >
              {countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại email'}
            </Button>

            <button
              type="button"
              onClick={() => onNavigate?.('/login')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang Đăng nhập</span>
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}

export default ForgotPasswordPage
