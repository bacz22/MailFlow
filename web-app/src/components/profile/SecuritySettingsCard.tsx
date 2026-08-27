import React, { useState } from 'react'
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Link,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { FormField, FormLabel } from '../ui/FormGroup'
import { useToast } from '../ui/Toast'
import type { UserProfile } from '../../types/profile.types'

export interface SecuritySettingsCardProps {
  profile: UserProfile
  onPasswordChange: (currentPass: string, newPass: string) => Promise<void>
}

export const SecuritySettingsCard: React.FC<SecuritySettingsCardProps> = ({
  profile,
  onPasswordChange,
}) => {
  const { showToast } = useToast()

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [isChangingPass, setIsChangingPass] = useState(false)

  // Calculate password strength
  const getStrength = (pass: string) => {
    let score = 0
    if (pass.length >= 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    return score
  }

  const strength = getStrength(newPassword)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      showToast({
        type: 'error',
        title: 'Lỗi',
        description: 'Vui lòng nhập mật khẩu hiện tại.',
      })
      return
    }

    if (newPassword.length < 8) {
      showToast({
        type: 'error',
        title: 'Mật khẩu yếu',
        description: 'Mật khẩu mới phải có tối thiểu 8 ký tự.',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      showToast({
        type: 'error',
        title: 'Không khớp',
        description: 'Xác nhận mật khẩu mới không khớp với mật khẩu đã nhập.',
      })
      return
    }

    setIsChangingPass(true)
    await onPasswordChange(currentPassword, newPassword)
    setIsChangingPass(false)

    // Reset inputs
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="space-y-6">
      {/* 1. Change Password Card */}
      <Card className="border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm">Đổi Mật Khẩu Đăng Nhập</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Nên sử dụng mật khẩu mạnh bao gồm chữ hoa, chữ số và ký tự đặc biệt để bảo vệ tài khoản.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5">
          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs max-w-lg">
            <FormField>
              <FormLabel required>Mật Khẩu Hiện Tại</FormLabel>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  aria-label={showCurrent ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <FormField>
              <FormLabel required>Mật Khẩu Mới</FormLabel>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự..."
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  aria-label={showNew ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword.length > 0 && (
                <div className="space-y-1 pt-1 animate-in fade-in-0">
                  <div className="flex gap-1 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        strength === 1
                          ? 'w-1/4 bg-rose-500'
                          : strength === 2
                          ? 'w-2/4 bg-amber-500'
                          : strength === 3
                          ? 'w-3/4 bg-blue-500'
                          : 'w-full bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>
                      Độ mạnh:{' '}
                      <strong>
                        {strength <= 1
                          ? 'Yếu'
                          : strength === 2
                          ? 'Trung bình'
                          : strength === 3
                          ? 'Tốt'
                          : 'Rất mạnh'}
                      </strong>
                    </span>
                    <span>Ít nhất 8 ký tự</span>
                  </div>
                </div>
              )}
            </FormField>

            <FormField>
              <FormLabel required>Xác Nhận Mật Khẩu Mới</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                hasError={confirmPassword.length > 0 && confirmPassword !== newPassword}
              />
            </FormField>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isChangingPass}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                Cập Nhật Mật Khẩu Mới
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Connected OAuth Accounts Card */}
      <Card className="border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-indigo-600" />
            <CardTitle className="text-sm">Tài Khoản Liên Kết (OAuth Accounts)</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Quản lý các tài khoản bên thứ ba dùng để đăng nhập nhanh vào MailFlow.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {profile.oauthAccounts.map((oauth) => (
            <div key={oauth.provider} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold uppercase text-xs">
                  {oauth.provider === 'google' ? 'G' : oauth.provider === 'github' ? 'GH' : 'MS'}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 capitalize">
                    {oauth.provider} Account
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {oauth.connected ? oauth.email : 'Chưa liên kết'}
                  </div>
                </div>
              </div>

              <div>
                {oauth.connected ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 border-slate-200 dark:border-slate-700 text-xs"
                    onClick={() =>
                      showToast({
                        type: 'info',
                        title: 'Hủy liên kết',
                        description: `Đã ngắt kết nối với tài khoản ${oauth.provider}.`,
                      })
                    }
                  >
                    Ngắt Kết Nối
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-blue-600 text-xs"
                    onClick={() =>
                      showToast({
                        type: 'info',
                        title: 'Kết nối tài khoản',
                        description: `Đang chuyển hướng xác thực OAuth ${oauth.provider}...`,
                      })
                    }
                  >
                    Kết Nối Ngay
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default SecuritySettingsCard
