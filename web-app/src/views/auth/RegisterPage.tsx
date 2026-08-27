import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Check, X, ArrowRight } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { registerSchema, evaluatePasswordStrength } from '../../schemas/auth.schemas'
import type { RegisterFormData } from '../../schemas/auth.schemas'
import { authService } from '../../services/auth.service'
import { ApiError } from '../../services/apiClient'
import { Button } from '../../components/ui/Button'
import { Input, PasswordInput } from '../../components/ui/Input'
import { Checkbox } from '../../components/ui/Checkbox'
import { FormField, FormLabel, FormMessage } from '../../components/ui/FormGroup'
import { useToast } from '../../components/ui/Toast'

export interface RegisterPageProps {
  onNavigate?: (path: string) => void
  onRegisterSuccess?: (data: RegisterFormData) => void
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigate,
  onRegisterSuccess,
}) => {
  const { showToast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  const passwordVal = watch('password') || ''
  const acceptTermsVal = watch('acceptTerms')
  const strength = evaluatePasswordStrength(passwordVal)

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await authService.register(data)

      showToast({
        type: 'success',
        title: 'Đăng ký thành công',
        description: response.message || `Mã xác thực đã được gửi tới email ${data.email}.`,
      })

      if (onRegisterSuccess) {
        onRegisterSuccess(data)
      } else {
        onNavigate?.('/verify-email')
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        // Xử lý lỗi trùng email (409 Conflict)
        if (err.code === 'EMAIL_ALREADY_EXISTS') {
          setError('email', {
            type: 'server',
            message: err.detail || 'Email đã được sử dụng trong hệ thống.',
          })
          showToast({
            type: 'error',
            title: 'Email đã tồn tại',
            description: err.detail || 'Email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc dùng email khác.',
          })
          return
        }

        // Xử lý các lỗi validation từ backend (422 Unprocessable Entity)
        if (err.errors && err.errors.length > 0) {
          err.errors.forEach((fieldError) => {
            if (fieldError.field === 'passwordMatching') {
              setError('confirmPassword', {
                type: 'server',
                message: fieldError.message,
              })
            } else if (fieldError.field in data) {
              setError(fieldError.field as keyof RegisterFormData, {
                type: 'server',
                message: fieldError.message,
              })
            }
          })
          showToast({
            type: 'error',
            title: err.title || 'Dữ liệu không hợp lệ',
            description: err.detail || 'Vui lòng kiểm tra lại các thông tin đã nhập.',
          })
          return
        }

        // Các lỗi API khác
        showToast({
          type: 'error',
          title: err.title || 'Đăng ký thất bại',
          description: err.detail || err.message,
        })
      } else {
        // Lỗi mạng hoặc lỗi kết nối máy chủ
        showToast({
          type: 'error',
          title: 'Lỗi kết nối máy chủ',
          description: 'Không thể kết nối đến hệ thống backend. Vui lòng kiểm tra kết nối mạng và thử lại.',
        })
      }
    }
  }

  return (
    <AuthLayout
      title="Tạo Tài Khoản"
      subtitle="Bắt đầu trải nghiệm MailFlow ngay hôm nay"
    >
      <div className="space-y-5">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Name Row: First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <FormField>
              <FormLabel required>Họ & Tên đệm</FormLabel>
              <Input
                placeholder="Nguyễn Văn"
                hasError={!!errors.lastName}
                {...register('lastName')}
              />
              {errors.lastName && <FormMessage error={errors.lastName.message} />}
            </FormField>

            <FormField>
              <FormLabel required>Tên</FormLabel>
              <Input
                placeholder="A"
                hasError={!!errors.firstName}
                {...register('firstName')}
              />
              {errors.firstName && <FormMessage error={errors.firstName.message} />}
            </FormField>
          </div>

          {/* Business Email */}
          <FormField>
            <FormLabel required>Email</FormLabel>
            <Input
              type="email"
              placeholder="email@domain.com"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              hasError={!!errors.email}
              {...register('email')}
            />
            {errors.email && <FormMessage error={errors.email.message} />}
          </FormField>

          {/* Password */}
          <FormField>
            <FormLabel required>Mật khẩu</FormLabel>
            <PasswordInput
              placeholder="Tối thiểu 8 ký tự, gồm số và ký tự đặc biệt"
              hasError={!!errors.password}
              {...register('password')}
            />
            {errors.password && <FormMessage error={errors.password.message} />}
          </FormField>

          {/* Dynamic Password Requirements Checklist */}
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

              {/* Progress Bar */}
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

              {/* Criteria List */}
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

          {/* Terms & Privacy Checkbox */}
          <div className="space-y-1 pt-1">
            <Checkbox
              id="accept-terms"
              checked={!!acceptTermsVal}
              onCheckedChange={(checked) => setValue('acceptTerms', checked === true, { shouldValidate: true })}
              label="Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của MailFlow"
            />
            {errors.acceptTerms && (
              <p className="text-xs text-rose-500 font-medium pl-6">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center text-sm font-bold shadow-md shadow-blue-600/20"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Đăng Ký Tài Khoản
            </Button>
          </div>
        </form>

        {/* Login Link */}
        <div className="text-center pt-2 text-xs text-slate-500">
          Đã có tài khoản MailFlow?{' '}
          <button
            type="button"
            onClick={() => onNavigate?.('/login')}
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
