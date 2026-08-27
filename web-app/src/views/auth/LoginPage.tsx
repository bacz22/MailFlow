import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, AlertCircle, ArrowRight } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { loginSchema } from '../../schemas/auth.schemas'
import type { LoginFormData } from '../../schemas/auth.schemas'
import { Button } from '../../components/ui/Button'
import { Input, PasswordInput } from '../../components/ui/Input'
import { Checkbox } from '../../components/ui/Checkbox'
import { FormField, FormLabel, FormMessage } from '../../components/ui/FormGroup'
import { useToast } from '../../components/ui/Toast'
import { authService } from '../../services/auth.service'
import { ApiError } from '../../services/apiClient'

export interface LoginPageProps {
  onNavigate?: (path: string) => void
  onLoginSuccess?: (data: LoginFormData) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  const { showToast } = useToast()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  })

  const rememberMeValue = watch('rememberMe')

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)

    try {
      const response = await authService.login(data)

      showToast({
        type: 'success',
        title: 'Đăng nhập thành công',
        description: `Chào mừng ${response.user.firstName || data.email} trở lại MailFlow!`,
      })

      if (onLoginSuccess) {
        onLoginSuccess(data)
      } else {
        onNavigate?.('/dashboard')
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.code === 'EMAIL_NOT_VERIFIED') {
          showToast({
            type: 'warning',
            title: 'Chưa kích hoạt tài khoản',
            description: 'Vui lòng xác thực email trước khi đăng nhập.',
          })
          onNavigate?.(`/verify-email?email=${encodeURIComponent(data.email)}`)
          return
        }

        if (err.code === 'INVALID_CREDENTIALS') {
          setServerError('Email hoặc mật khẩu không chính xác.')
          return
        }

        if (err.code === 'ACCOUNT_LOCKED') {
          setServerError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.')
          return
        }

        if (err.code === 'ACCOUNT_DISABLED') {
          setServerError('Tài khoản này đã bị vô hiệu hóa.')
          return
        }

        setServerError(err.detail || err.title || 'Đăng nhập thất bại. Vui lòng thử lại.')
      } else {
        setServerError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.')
      }
    }
  }

  return (
    <AuthLayout
      title="Đăng Nhập MailFlow"
      subtitle="Nhập thông tin tài khoản để truy cập không gian làm việc của bạn."
    >
      <div className="space-y-5">
        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{serverError}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email Field */}
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

          {/* Password Field */}
          <FormField>
            <div className="flex items-center justify-between">
              <FormLabel required>Mật khẩu</FormLabel>
              <button
                type="button"
                onClick={() => onNavigate?.('/forgot-password')}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>
            <PasswordInput
              placeholder="••••••••"
              hasError={!!errors.password}
              {...register('password')}
            />
            {errors.password && <FormMessage error={errors.password.message} />}
          </FormField>

          {/* Remember Me */}
          <div className="pt-1">
            <Checkbox
              id="remember-me"
              checked={!!rememberMeValue}
              onCheckedChange={(checked) => setValue('rememberMe', !!checked)}
              label="Ghi nhớ đăng nhập trên thiết bị này"
            />
          </div>

          {/* Sign In Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center text-sm font-bold shadow-md shadow-blue-600/20"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Đăng Nhập
            </Button>
          </div>
        </form>

        {/* Register Link */}
        <div className="text-center pt-2 text-xs text-slate-500">
          Chưa có tài khoản MailFlow?{' '}
          <button
            type="button"
            onClick={() => onNavigate?.('/register')}
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
