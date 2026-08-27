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
import type { UserProfile } from '../types/profile.types'

const INITIAL_PROFILE: UserProfile = {
  id: 'usr-admin-1',
  firstName: 'Admin',
  lastName: 'Nguyễn Văn',
  email: 'admin@mailflow.vn',
  phoneNumber: '+84 912 345 678',
  jobTitle: 'Trưởng Nhóm Vận Hành (Lead Marketing Ops)',
  isEmailVerified: true,
  twoFactorEnabled: true,
  oauthAccounts: [
    {
      provider: 'google',
      connected: true,
      email: 'admin.nguyen@gmail.com',
    },
    {
      provider: 'github',
      connected: true,
      email: 'admin-mailflow-dev',
    },
    {
      provider: 'microsoft',
      connected: false,
    },
  ],
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
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>(subSection)
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE)

  const handleSaveProfile = async (updated: Partial<UserProfile>) => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    setProfile((prev) => ({ ...prev, ...updated }))
    showToast({
      type: 'success',
      title: 'Đã cập nhật hồ sơ',
      description: 'Thông tin cá nhân đã được lưu thành công.',
    })
  }

  const handlePasswordChange = async (_currentPass: string, _newPass: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    showToast({
      type: 'success',
      title: 'Đổi mật khẩu thành công',
      description: 'Mật khẩu đăng nhập mới đã được kích hoạt.',
    })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Hồ Sơ & Cài Đặt Tài Khoản (Profile & Security)"
        description="Quản lý định danh cá nhân, đổi mật khẩu bảo mật, quản lý liên kết tài khoản OAuth và giám sát các phiên làm việc đang hoạt động."
      />

      {/* 2. Sub-navigation tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        {[
          { id: 'profile', label: 'Thông Tin Hồ Sơ', icon: <User className="w-4 h-4" /> },
          { id: 'security', label: 'Bảo Mật & Mật Khẩu', icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'sessions', label: 'Phiên Đăng Nhập (Sessions)', icon: <Laptop className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
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

      {/* ================= TAB 1: PROFILE ================= */}
      {activeTab === 'profile' && (
        <div className="animate-in fade-in-0">
          <ProfileInfoCard profile={profile} onSave={handleSaveProfile} />
        </div>
      )}

      {/* ================= TAB 2: SECURITY ================= */}
      {activeTab === 'security' && (
        <div className="animate-in fade-in-0">
          <SecuritySettingsCard
            profile={profile}
            onPasswordChange={handlePasswordChange}
          />
        </div>
      )}

      {/* ================= TAB 3: SESSIONS ================= */}
      {activeTab === 'sessions' && (
        <div className="animate-in fade-in-0">
          <SessionsListCard />
        </div>
      )}
    </div>
  )
}

export default ProfilePage
