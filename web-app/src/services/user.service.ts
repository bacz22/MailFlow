import { apiClient } from './apiClient'
import type { CurrentUserResponse, UpdateProfileRequest } from '../types/auth.types'

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const userService = {
  async getMe(): Promise<CurrentUserResponse> {
    return apiClient<CurrentUserResponse>('/users/me', {
      method: 'GET',
    })
  },

  async updateMe(data: UpdateProfileRequest): Promise<CurrentUserResponse> {
    return apiClient<CurrentUserResponse>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() ?? '',
        jobTitle: data.jobTitle?.trim() ?? '',
      }),
    })
  },

  async uploadAvatar(file: File): Promise<CurrentUserResponse> {
    const form = new FormData()
    form.append('file', file)
    return apiClient<CurrentUserResponse>('/users/me/avatar', {
      method: 'POST',
      body: form,
    })
  },

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

export function formatAccountRole(roles: string[] | undefined): string {
  if (!roles || roles.length === 0) {
    return 'User'
  }
  const primary = roles.includes('ROLE_OWNER')
    ? 'ROLE_OWNER'
    : [...roles].sort()[0]
  return primary
    .replace(/^ROLE_/, '')
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

export function displayName(user: { firstName: string; lastName: string }): string {
  return `${user.lastName} ${user.firstName}`.trim()
}
