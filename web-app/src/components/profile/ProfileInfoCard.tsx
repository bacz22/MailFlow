import React, { useEffect, useRef, useState } from 'react'
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Camera,
  CheckCircle2,
  Save,
  UploadCloud,
  Sparkles,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { FormField, FormLabel } from '../ui/FormGroup'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/Dialog'
import { useToast } from '../ui/Toast'
import type { UserProfile } from '../../types/profile.types'

export interface ProfileInfoCardProps {
  profile: UserProfile
  onSave: (updated: Partial<UserProfile>) => Promise<void>
  onUploadAvatar: (file: File) => Promise<void>
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({ profile, onSave, onUploadAvatar }) => {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [email] = useState(profile.email)
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber)
  const [jobTitle, setJobTitle] = useState(profile.jobTitle)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Confirmation dialog state for avatar upload
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  useEffect(() => {
    setFirstName(profile.firstName)
    setLastName(profile.lastName)
    setPhoneNumber(profile.phoneNumber)
    setJobTitle(profile.jobTitle)
  }, [profile.firstName, profile.lastName, profile.phoneNumber, profile.jobTitle])

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
    try {
      await onSave({
        firstName,
        lastName,
        phoneNumber,
        jobTitle,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const openFilePicker = () => fileInputRef.current?.click()

  const handleAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) {
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast({
        type: 'error',
        title: 'Định dạng không hỗ trợ',
        description: 'Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.',
      })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'Ảnh quá lớn',
        description: 'Ảnh đại diện tối đa 2MB.',
      })
      return
    }

    // Generate local preview URL & open confirmation modal
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl)
    }
    const previewUrl = URL.createObjectURL(file)
    setPendingAvatarFile(file)
    setPendingPreviewUrl(previewUrl)
    setIsConfirmDialogOpen(true)
  }

  const handleCloseConfirmDialog = () => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl)
    }
    setPendingAvatarFile(null)
    setPendingPreviewUrl(null)
    setIsConfirmDialogOpen(false)
  }

  const handleConfirmUploadAvatar = async () => {
    if (!pendingAvatarFile) return

    setIsUploadingAvatar(true)
    try {
      await onUploadAvatar(pendingAvatarFile)
      handleCloseConfirmDialog()
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Helper format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarSelected}
            />

            <div className="relative group w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0 overflow-hidden">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.firstName || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                firstName.charAt(0) || 'A'
              )}

              <button
                type="button"
                onClick={openFilePicker}
                disabled={isUploadingAvatar}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
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
                Khuyến nghị ảnh vuông tỉ lệ 1:1, dung lượng tối đa 2MB (JPG, PNG, WebP).
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={openFilePicker}
                  isLoading={isUploadingAvatar}
                >
                  Tải Ảnh Lên
                </Button>
              </div>
            </div>
          </div>

          {/* Name Row */}
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
                placeholder="An"
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
                  {profile.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Đã Xác Thực</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                      <span>Chưa xác thực</span>
                    </span>
                  )}
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

      {/* Confirmation Modal for Avatar Upload */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={(open) => !open && handleCloseConfirmDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <UploadCloud className="w-5 h-5" />
              <DialogTitle>Xác Nhận Đổi Ảnh Đại Diện</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Vui lòng kiểm tra lại hình ảnh đại diện mới trước khi tải lên máy chủ Cloudinary.
            </DialogDescription>
          </DialogHeader>

          {/* Avatar Preview Box */}
          <div className="py-3 flex flex-col items-center justify-center gap-3">
            <div className="relative w-28 h-28 rounded-full border-4 border-blue-500/20 dark:border-blue-400/20 shadow-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-4 ring-blue-500/10">
              {pendingPreviewUrl ? (
                <img
                  src={pendingPreviewUrl}
                  alt="Xem trước ảnh đại diện mới"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>

            {pendingAvatarFile && (
              <div className="text-center space-y-0.5">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                  {pendingAvatarFile.name}
                </p>
                <p className="text-[11px] font-mono text-slate-400">
                  Kích thước: {formatFileSize(pendingAvatarFile.size)} • {pendingAvatarFile.type.replace('image/', '').toUpperCase()}
                </p>
              </div>
            )}

            <div className="w-full p-2.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/70 dark:border-blue-800/60 text-center">
              <p className="text-[11px] text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Ảnh sẽ được đồng bộ ngay tức thì trên toàn bộ thanh Menu & Header.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploadingAvatar}
              onClick={handleCloseConfirmDialog}
            >
              Hủy Bỏ
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 font-bold"
              isLoading={isUploadingAvatar}
              onClick={handleConfirmUploadAvatar}
            >
              Lưu Ảnh Mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default ProfileInfoCard
