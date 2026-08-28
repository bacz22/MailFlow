export interface FieldErrorDetail {
  field: string
  code: string
  message: string
}

export interface ApiProblemDetails {
  type: string
  title: string
  status: number
  code: string
  detail: string
  instance?: string
  requestId?: string
  timestamp?: string
  errors?: FieldErrorDetail[]
}

export interface UserSummaryDto {
  id: string
  email: string
  firstName: string
  lastName: string
  status: 'PENDING' | 'ACTIVE' | 'LOCKED' | 'DISABLED'
}

export interface CurrentUserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  status: 'PENDING' | 'ACTIVE' | 'LOCKED' | 'DISABLED'
  emailVerified: boolean
  phone: string | null
  jobTitle: string | null
  roles: string[]
  twoFactorEnabled: boolean
  avatarUrl: string | null
}

export interface UpdateProfileRequest {
  firstName: string
  lastName: string
  phone?: string | null
  jobTitle?: string | null
}

export interface RegisterResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  status: 'PENDING' | 'ACTIVE' | 'LOCKED' | 'DISABLED'
  roles: string[]
  message: string
  createdAt: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: UserSummaryDto
}

export interface RefreshResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export interface SessionResponse {
  id: string
  device: string
  browser: string
  operatingSystem: string
  ipAddress: string
  lastActiveAt: string
  createdAt: string
  isCurrent?: boolean
  current?: boolean
}

export interface VerifyEmailRequest {
  token: string
}

export interface VerifyEmailResponse {
  email: string
  status: 'ACTIVE' | 'PENDING' | 'LOCKED' | 'DISABLED'
  message: string
}

export interface ResendVerificationRequest {
  email: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface ResetPasswordResponse {
  message: string
}
