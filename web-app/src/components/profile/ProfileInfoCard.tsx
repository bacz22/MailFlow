import React, { useState } from 'react'
import { User, Mail, Phone, Briefcase, Camera, CheckCircle2, Save } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { FormField, FormLabel } from '../ui/FormGroup'
import { useToast } from '../ui/Toast'
import type { UserProfile } from '../../types/profile.types'

export interface ProfileInfoCardProps {
  profile: UserProfile
  onSave: (updated: Partial<UserProfile>) => Promise<void>
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({ profile, onSave }) => {
  const { showToast } = useToast()

  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [email] = useState(profile.email)
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber)
  const [jobTitle, setJobTitle] = useState(profile.jobTitle)
  const [isSaving, setIsSaving] = useState(false)

  const isDirty =
    firstName !== profile.firstName ||
    lastName !== profile.lastName ||
    phoneNumber !== profile.phoneNumber ||
    jobTitle !== profile.jobTitle

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      showToast({
        type: 'error',
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập đầy đủ họ và tên.',
      })
      return
    }

    setIsSaving(true)
    await onSave({
      firstName,
      lastName,
      phoneNumber,
      jobTitle,
    })
    setIsSaving(false)
  }

  return (
    <Card className="border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <CardTitle className="text-sm">Hồ Sơ & Thông Tin Cá Nhân</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Thông tin họ tên và định danh hiển thị trên toàn hệ thống MailFlow.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative group w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0">
              {firstName.charAt(0) || 'A'}
              <button
                type="button"
                onClick={() =>
                  showToast({
                    type: 'info',
                    title: 'Đổi ảnh đại diện',
                    description: 'Chọn ảnh chân dung JPG hoặc PNG để tải lên.',
                  })
                }
                className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Ảnh Đại Diện (Avatar)
              </div>
              <p className="text-[11px] text-slate-500">
                Khuyến nghị ảnh vuông tỉ lệ 1:1, dung lượng tối đa 2MB.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    showToast({
                      type: 'info',
                      title: 'Đổi ảnh đại diện',
                      description: 'Chọn ảnh chân dung JPG hoặc PNG để tải lên.',
                    })
                  }
                >
                  Tải Ảnh Lên
                </Button>
              </div>
            </div>
          </div>

          {/* Form inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField>
              <FormLabel required>Họ và Tên Đệm (Last Name)</FormLabel>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nguyễn Văn"
              />
            </FormField>

            <FormField>
              <FormLabel required>Tên (First Name)</FormLabel>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Admin"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField>
              <FormLabel required>Email Tài Khoản (Đăng nhập chính)</FormLabel>
              <div className="relative">
                <Input
                  value={email}
                  disabled
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  className="bg-slate-100 dark:bg-slate-800/60 font-mono text-slate-600 dark:text-slate-400"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Đã Xác Thực</span>
                  </span>
                </div>
              </div>
            </FormField>

            <FormField>
              <FormLabel>Số Điện Thoại Liên Hệ</FormLabel>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+84 912 345 678"
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
              />
            </FormField>
          </div>

          <FormField>
            <FormLabel>Chức Danh / Vị Trí Công Việc</FormLabel>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Head of Marketing / Email Specialist"
              leftIcon={<Briefcase className="w-4 h-4 text-slate-400" />}
            />
          </FormField>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!isDirty || isSaving}
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isDirty ? 'Lưu Thông Tin Hồ Sơ' : 'Đã Lưu'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default ProfileInfoCard
