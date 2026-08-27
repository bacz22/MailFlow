import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, X, CheckCircle2, ArrowRight } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { resetPasswordSchema, evaluatePasswordStrength } from '../../schemas/auth.schemas'
import type { ResetPasswordFormData } from '../../schemas/auth.schemas'
import { Button } from '../../components/ui/Button'
import { PasswordInput } from '../../components/ui/Input'
import { FormField, FormLabel, FormMessage } from '../../components/ui/FormGroup'
import { useToast } from '../../components/ui/Toast'

export interface ResetPasswordPageProps {
  onNavigate?: (path: string) => void
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
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

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsSuccess(true)
    showToast({
      type: 'success',
      title: 'Mật khẩu đã thay đổi',
      description: 'Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.',
    })
  }

  return (
    <AuthLayout
      title="Đặt Lại Mật Khẩu Mới"
      subtitle={
        isSuccess
          ? 'Mật khẩu của bạn đã được cập nhật an toàn.'
          : 'Tạo mật khẩu mới mạnh mẽ để bảo vệ tài khoản MailFlow của bạn.'
      }
    >
      {!isSuccess ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* New Password */}
          <FormField>
            <FormLabel required>Mật khẩu mới</FormLabel>
            <PasswordInput
              placeholder="Tối thiểu 8 ký tự, gồm số và ký tự đặc biệt"
              hasError={!!errors.password}
              {...register('password')}
            />
            {errors.password && <FormMessage error={errors.password.message} />}
          </FormField>

          {/* Live Password Checklist */}
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

          {/* Confirm Password */}
          <FormField>
            <FormLabel required>Xác nhận lại mật khẩu</FormLabel>
            <PasswordInput
              placeholder="Nhập lại mật khẩu"
              hasError={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <FormMessage error={errors.confirmPassword.message} />}
          </FormField>

          {/* Submit */}
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
      ) : (
        /* Success State */
        <div className="space-y-5 text-center animate-in fade-in-0">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-md">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Đổi Mật Khẩu Thành Công!
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Mật khẩu mới của bạn đã có hiệu lực trên toàn bộ phiên làm việc của MailFlow.
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
    </AuthLayout>
  )
}

export default ResetPasswordPage
