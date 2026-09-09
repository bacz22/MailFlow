import React, { useState } from 'react'
import {
  User,
  ShieldCheck,
  Laptop,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ProfileInfoCard } from '../components/profile/ProfileInfoCard'
import { SecuritySettingsCard } from '../components/profile/SecuritySettingsCard'
import { SessionsListCard } from '../components/profile/SessionsListCard'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services/user.service'
import { ApiError } from '../services/apiClient'
import type { UserProfile } from '../types/profile.types'
import type { CurrentUserResponse } from '../types/auth.types'

const MOCK_OAUTH: UserProfile['oauthAccounts'] = [
  { provider: 'google', connected: false },
  { provider: 'github', connected: false },
  { provider: 'microsoft', connected: false },
]

function toUserProfile(user: CurrentUserResponse): UserProfile {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phone ?? '',
    jobTitle: user.jobTitle ?? '',
    avatarUrl: user.avatarUrl ?? undefined,
    isEmailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    oauthAccounts: MOCK_OAUTH,
  }
}

export interface ProfilePageProps {
  onNavigate: (path: string) => void
  subSection?: 'profile' | 'security' | 'sessions'
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigate: _onNavigate,
  subSection = 'profile',
}) => {
  const { showToast } = useToast()
  const { user, setUser, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>(subSection)

  const profile: UserProfile | null = user ? toUserProfile(user) : null

  const handleSaveProfile = async (updated: Partial<UserProfile>) => {
    try {
      const saved = await userService.updateMe({
        firstName: updated.firstName ?? user?.firstName ?? '',
        lastName: updated.lastName ?? user?.lastName ?? '',
        phone: updated.phoneNumber ?? '',
        jobTitle: updated.jobTitle ?? '',
      })
      setUser(saved)
      showToast({
        type: 'success',
        title: 'Đã cập nhật hồ sơ',
        description: 'Thông tin cá nhân đã được lưu thành công.',
      })
    } catch (err) {
      const detail = err instanceof ApiError ? err.detail : 'Không thể lưu hồ sơ. Vui lòng thử lại.'
      showToast({
        type: 'error',
        title: 'Cập nhật thất bại',
        description: detail,
      })
      throw err
    }
  }

  const handleUploadAvatar = async (file: File) => {
    try {
      const saved = await userService.uploadAvatar(file)
      setUser(saved)
      showToast({
        type: 'success',
        title: 'Đã cập nhật ảnh đại diện',
        description: 'Ảnh mới đã được lưu trên Cloudinary.',
      })
    } catch (err) {
      const detail = err instanceof ApiError ? err.detail : 'Không tải được ảnh. Vui lòng thử lại.'
      showToast({
        type: 'error',
        title: 'Tải ảnh thất bại',
        description: detail,
      })
      throw err
    }
  }

  const handlePasswordChange = async (currentPass: string, newPass: string, confirmPass: string) => {
    try {
      const res = await userService.changePassword({
        currentPassword: currentPass,
        newPassword: newPass,
        confirmPassword: confirmPass,
      })
      showToast({
        type: 'success',
        title: 'Đổi mật khẩu thành công',
        description: res.message || 'Mật khẩu đăng nhập mới đã được kích hoạt.',
      })
    } catch (err: unknown) {
      const detail = err instanceof ApiError ? err.detail : 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại.'
      showToast({
        type: 'error',
        title: 'Đổi mật khẩu thất bại',
        description: detail,
      })
      throw err
    }
  }

  if (!profile) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <PageHeader
          title="Hồ Sơ & Cài Đặt Tài Khoản (Profile & Security)"
          description="Không tải được thông tin tài khoản. Hãy đăng nhập lại."
        />
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => refreshUser()}
        >
          Thử tải lại hồ sơ
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Hồ Sơ & Cài Đặt Tài Khoản (Profile & Security)"
        description="Quản lý định danh cá nhân, đổi mật khẩu bảo mật, quản lý liên kết tài khoản OAuth và giám sát các phiên làm việc đang hoạt động."
      />

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        {[
          { id: 'profile', label: 'Thông Tin Hồ Sơ', icon: <User className="w-4 h-4" /> },
          { id: 'security', label: 'Bảo Mật & Mật Khẩu', icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'sessions', label: 'Phiên Đăng Nhập (Sessions)', icon: <Laptop className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as 'profile' | 'security' | 'sessions')}
            className={`px-4 py-2.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="animate-in fade-in-0">
          <ProfileInfoCard
            key={profile.id}
            profile={profile}
            onSave={handleSaveProfile}
            onUploadAvatar={handleUploadAvatar}
          />
        </div>
      )}

      {activeTab === 'security' && (
        <div className="animate-in fade-in-0">
          <SecuritySettingsCard
            profile={profile}
            onPasswordChange={handlePasswordChange}
          />
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="animate-in fade-in-0">
          <SessionsListCard />
        </div>
      )}
    </div>
  )
}

export default ProfilePage
