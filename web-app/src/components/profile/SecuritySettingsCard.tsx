import React, { useState } from 'react'
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { FormField, FormLabel } from '../ui/FormGroup'
import { useToast } from '../ui/Toast'
import type { UserProfile } from '../../types/profile.types'

export interface SecuritySettingsCardProps {
  profile?: UserProfile
  onPasswordChange: (currentPass: string, newPass: string, confirmPass: string) => Promise<void>
}

export const SecuritySettingsCard: React.FC<SecuritySettingsCardProps> = ({
  onPasswordChange,
}) => {
  const { showToast } = useToast()

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
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
        description: 'Mật khẩu xác nhận không khớp với mật khẩu mới.',
      })
      return
    }

    setIsChangingPass(true)
    try {
      await onPasswordChange(currentPassword, newPassword, confirmPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } finally {
      setIsChangingPass(false)
    }
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
          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
            {/* Current Password */}
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            {/* New Password */}
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {newPassword.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full transition-all duration-300 ${
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
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {strength === 1 && 'Rất Yếu'}
                      {strength === 2 && 'Trung Bình'}
                      {strength === 3 && 'Khá Mạnh'}
                      {strength === 4 && 'Rất Mạnh'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Bao gồm tối thiểu 8 ký tự, chữ hoa, số và ký tự đặc biệt (!@#$%).
                  </p>
                </div>
              )}
            </FormField>

            {/* Confirm New Password */}
            <FormField>
              <FormLabel required>Xác Nhận Mật Khẩu Mới</FormLabel>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  hasError={confirmPassword.length > 0 && confirmPassword !== newPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <div className="flex justify-end pt-3">
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
    </div>
  )
}

export default SecuritySettingsCard
