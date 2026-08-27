import { apiClient, setAccessToken } from './apiClient'
import type { LoginFormData, RegisterFormData } from '../schemas/auth.schemas'
import type {
  LoginResponse,
  RefreshResponse,
  RegisterResponse,
  SessionResponse,
  VerifyEmailResponse,
} from '../types/auth.types'

export const authService = {
  /**
   * Gọi API đăng ký tài khoản mới POST /auth/register
   */
  async register(data: RegisterFormData): Promise<RegisterResponse> {
    return apiClient<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        acceptTerms: data.acceptTerms,
      }),
    })
  },

  /**
   * Gọi API đăng nhập POST /auth/login
   */
  async login(data: LoginFormData): Promise<LoginResponse> {
    const res = await apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        rememberMe: !!data.rememberMe,
      }),
    })
    setAccessToken(res.accessToken)
    return res
  },

  /**
   * Gọi API xoay vòng token POST /auth/refresh
   */
  async refresh(): Promise<RefreshResponse> {
    const res = await apiClient<RefreshResponse>('/auth/refresh', {
      method: 'POST',
    })
    setAccessToken(res.accessToken)
    return res
  },

  /**
   * Đăng xuất phiên hiện tại POST /auth/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient<void>('/auth/logout', {
        method: 'POST',
      })
    } finally {
      setAccessToken(null)
    }
  },

  /**
   * Đăng xuất tất cả các phiên POST /auth/logout-all
   */
  async logoutAll(): Promise<void> {
    try {
      await apiClient<void>('/auth/logout-all', {
        method: 'POST',
      })
    } finally {
      setAccessToken(null)
    }
  },

  /**
   * Lấy danh sách các phiên đăng nhập đang hoạt động GET /auth/sessions
   */
  async getSessions(): Promise<SessionResponse[]> {
    return apiClient<SessionResponse[]>('/auth/sessions', {
      method: 'GET',
    })
  },

  /**
   * Thu hồi 1 phiên đăng nhập cụ thể DELETE /auth/sessions/{sessionId}
   */
  async revokeSession(sessionId: string): Promise<void> {
    return apiClient<void>(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Gọi API xác thực email POST /auth/verify-email
   */
  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    return apiClient<VerifyEmailResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({
        token: token.trim(),
      }),
    })
  },

  /**
   * Gọi API gửi lại email xác thực POST /auth/resend-verification
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    })
  },
}
