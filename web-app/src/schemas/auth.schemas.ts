import { z } from 'zod'

/**
 * 1. Login Schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ email')
    .email('Địa chỉ email không đúng định dạng'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  rememberMe: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * 2. Register Schema
 */
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'Vui lòng nhập tên')
      .max(50, 'Tên không được quá 50 ký tự'),
    lastName: z
      .string()
      .min(1, 'Vui lòng nhập họ & tên đệm')
      .max(50, 'Họ không được quá 50 ký tự'),
    email: z
      .string()
      .min(1, 'Vui lòng nhập địa chỉ email')
      .email('Địa chỉ email không đúng định dạng'),
    password: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu')
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Phải chứa ít nhất 1 chữ cái in hoa')
      .regex(/[0-9]/, 'Phải chứa ít nhất 1 chữ số')
      .regex(/[^A-Za-z0-9]/, 'Phải chứa ít nhất 1 ký tự đặc biệt (!@#$%...)'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    acceptTerms: z
      .boolean({
        error: 'Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật',
      })
      .refine((val) => val === true, {
        message: 'Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

export type RegisterFormData = z.infer<typeof registerSchema>

/**
 * 3. Forgot Password Schema
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ email đã đăng ký')
    .email('Địa chỉ email không đúng định dạng'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

/**
 * 4. Reset Password Schema
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu mới')
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Phải chứa ít nhất 1 chữ cái in hoa')
      .regex(/[0-9]/, 'Phải chứa ít nhất 1 chữ số')
      .regex(/[^A-Za-z0-9]/, 'Phải chứa ít nhất 1 ký tự đặc biệt (!@#$%...)'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận lại mật khẩu mới'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

/**
 * Helper to test individual password strength criteria
 */
export function evaluatePasswordStrength(password: string) {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  const score = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length

  return {
    score,
    isStrong: score === 4,
    criteria: [
      { label: 'Tối thiểu 8 ký tự', met: hasMinLength },
      { label: 'Ít nhất 1 chữ hoa (A-Z)', met: hasUppercase },
      { label: 'Ít nhất 1 chữ số (0-9)', met: hasNumber },
      { label: 'Ít nhất 1 ký tự đặc biệt (!@#$...)', met: hasSpecial },
    ],
  }
}
