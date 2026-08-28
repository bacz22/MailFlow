import React, { useRef, useState } from 'react'
import {
  Building2,
  Palette,
  Sliders,
  AlertTriangle,
  Save,
  Trash2,
  Lock,
  Upload,
  Camera,
  UploadCloud,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { FormField, FormLabel } from '../components/ui/FormGroup'
import { Badge } from '../components/ui/Badge'
import { SimpleSelect } from '../components/ui/Select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog'
import { DeleteWorkspaceConfirmDialog } from '../components/workspace/DeleteWorkspaceConfirmDialog'
import { useToast } from '../components/ui/Toast'
import { usePermission, PERMISSIONS } from '../permissions'
import { useWorkspace } from '../context/WorkspaceContext'
import { workspaceService } from '../services/workspace.service'
import { ApiError } from '../services/apiClient'
import type { WorkspaceSettings } from '../types/workspace.types'

const EMPTY_SETTINGS: WorkspaceSettings = {
  id: '',
  name: '',
  slug: '',
  displayName: '',
  brandColor: '#2563eb',
  timezone: 'Asia/Bangkok',
  enableOpenTracking: true,
  enableClickTracking: true,
  enforceRfc8058: true,
  industry: '',
}

function normalizeTimezone(value?: string): string {
  if (!value) return 'Asia/Bangkok'
  if (value.startsWith('Asia/Bangkok')) return 'Asia/Bangkok'
  if (value.startsWith('Asia/Singapore')) return 'Asia/Singapore'
  if (value.startsWith('Asia/Tokyo')) return 'Asia/Tokyo'
  if (value.startsWith('UTC')) return 'UTC'
  return value
}

const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const BRAND_COLORS = [
  { name: 'Xanh Lam (Blue)', value: '#2563eb', bgClass: 'bg-blue-600' },
  { name: 'Xanh Chàm (Indigo)', value: '#4f46e5', bgClass: 'bg-indigo-600' },
  { name: 'Tím (Purple)', value: '#7c3aed', bgClass: 'bg-purple-600' },
  { name: 'Xanh Lục (Emerald)', value: '#059669', bgClass: 'bg-emerald-600' },
  { name: 'Cam Đỏ (Orange)', value: '#ea580c', bgClass: 'bg-orange-600' },
  { name: 'Đen Tuyển (Dark)', value: '#0f172a', bgClass: 'bg-slate-900' },
]

export interface WorkspaceSettingsPageProps {
  onNavigate: (path: string) => void
}

export const WorkspaceSettingsPage: React.FC<WorkspaceSettingsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const { hasPermission } = usePermission()
  const { currentWorkspaceId, refreshWorkspaces, deleteCurrentWorkspace } = useWorkspace()

  const [settings, setSettings] = useState<WorkspaceSettings>(EMPTY_SETTINGS)
  const [initialSettings, setInitialSettings] = useState<WorkspaceSettings>(EMPTY_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)
  const [pendingLogoPreviewUrl, setPendingLogoPreviewUrl] = useState<string | null>(null)
  const [isLogoConfirmOpen, setIsLogoConfirmOpen] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const canUpdate = hasPermission(PERMISSIONS.WORKSPACE_UPDATE)
  const canDelete = hasPermission(PERMISSIONS.WORKSPACE_DELETE)

  React.useEffect(() => {
    if (!currentWorkspaceId) {
      return
    }
    let cancelled = false
    setIsLoading(true)
    workspaceService
      .getSettings(currentWorkspaceId)
      .then((data) => {
        if (cancelled) return
        const next = { ...data, timezone: normalizeTimezone(data.timezone), industry: data.industry || '' }
        setSettings(next)
        setInitialSettings(next)
      })
      .catch((error) => {
        if (cancelled) return
        showToast({
          type: 'error',
          title: 'Không tải được cài đặt workspace',
          description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
        })
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [currentWorkspaceId, showToast])

  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings)

  const handleSave = async () => {
    if (!currentWorkspaceId) return
    setIsSaving(true)
    try {
      const saved = await workspaceService.updateSettings(currentWorkspaceId, {
        name: settings.name,
        slug: settings.slug,
        displayName: settings.displayName,
        brandColor: settings.brandColor,
        timezone: settings.timezone,
        industry: settings.industry,
        enableOpenTracking: settings.enableOpenTracking,
        enableClickTracking: settings.enableClickTracking,
        enforceRfc8058: settings.enforceRfc8058,
      })
      const next = { ...saved, timezone: normalizeTimezone(saved.timezone), industry: saved.industry || '' }
      setSettings(next)
      setInitialSettings(next)
      await refreshWorkspaces()
      showToast({
        type: 'success',
        title: 'Đã lưu cấu hình Workspace',
        description: 'Các thay đổi thông tin và tùy chọn nhận diện đã được áp dụng toàn hệ thống.',
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không lưu được cài đặt',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const closeLogoConfirmDialog = () => {
    if (pendingLogoPreviewUrl) {
      URL.revokeObjectURL(pendingLogoPreviewUrl)
    }
    setPendingLogoFile(null)
    setPendingLogoPreviewUrl(null)
    setIsLogoConfirmOpen(false)
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const handleLogoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) {
      return
    }
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      showToast({
        type: 'error',
        title: 'Định dạng không hỗ trợ',
        description: 'Chỉ chấp nhận ảnh PNG, SVG, JPG hoặc WebP.',
      })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'Ảnh quá lớn',
        description: 'Logo tối đa 2MB. Vui lòng chọn file nhỏ hơn.',
      })
      return
    }
    if (pendingLogoPreviewUrl) {
      URL.revokeObjectURL(pendingLogoPreviewUrl)
    }
    setPendingLogoFile(file)
    setPendingLogoPreviewUrl(URL.createObjectURL(file))
    setIsLogoConfirmOpen(true)
  }

  const handleConfirmUploadLogo = async () => {
    if (!currentWorkspaceId || !pendingLogoFile) return
    setIsUploadingLogo(true)
    try {
      const saved = await workspaceService.uploadLogo(currentWorkspaceId, pendingLogoFile)
      setSettings((prev) => ({ ...prev, logoUrl: saved.logoUrl }))
      setInitialSettings((prev) => ({ ...prev, logoUrl: saved.logoUrl }))
      await refreshWorkspaces()
      closeLogoConfirmDialog()
      showToast({
        type: 'success',
        title: 'Đã cập nhật logo',
        description: 'Ảnh nhận diện workspace đã được lưu.',
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tải được logo',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    try {
      await deleteCurrentWorkspace()
      showToast({
        type: 'success',
        title: 'Đã xóa không gian làm việc',
        description: 'Workspace đã được xóa. Đang chuyển về dashboard.',
      })
      onNavigate('/dashboard')
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xóa được workspace',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
      throw error
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* 1. Page Header with Save Action */}
      <PageHeader
        title="Cài Đặt Không Gian Làm Việc (Workspace Settings)"
        description="Quản lý định danh tổ chức, tùy chỉnh thương hiệu, múi giờ mặc định và kiểm soát các tác vụ quản trị cấp cao."
        actions={
          canUpdate && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!isDirty || isSaving || isLoading}
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSave}
            >
              {isDirty ? 'Lưu Thay Đổi' : 'Đã Lưu'}
            </Button>
          )
        }
      />

      {/* ================= SECTION 1: GENERAL SETTINGS ================= */}
      <Card className="border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm">Thông Tin Định Danh Chung (General)</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Tên và đường dẫn định danh (Slug) duy nhất của không gian làm việc.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel required>Tên Không Gian Làm Việc (Workspace Name)</FormLabel>
              <Input
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                disabled={!canUpdate}
              />
            </FormField>

            <FormField>
              <FormLabel required>Đường Dẫn Định Danh (Workspace Slug)</FormLabel>
              <Input
                value={settings.slug}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  })
                }
                disabled={!canUpdate}
              />
            </FormField>
          </div>

          {/* Slug URL Live Preview */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>
              URL Truy cập nội bộ: <strong>https://mailflow.vn/org/{settings.slug}</strong>
            </span>
            <Badge variant="default" className="text-[10px]">
              Tên miền phụ
            </Badge>
          </div>

          <FormField>
            <FormLabel>Lĩnh Vực Hoạt Động (Industry Category)</FormLabel>
            <Input
              value={settings.industry}
              onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
              disabled={!canUpdate}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* ================= SECTION 2: BRANDING ================= */}
      <Card className="border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-600" />
            <CardTitle className="text-sm">Nhận Diện Thương Hiệu (Branding)</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Tùy biến Logo, màu sắc chủ đạo và tên hiển thị trong chân trang email marketing.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              className="hidden"
              onChange={handleLogoSelected}
            />
            <div
              className="relative group w-16 h-16 rounded-2xl text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0 overflow-hidden"
              style={{ backgroundColor: settings.brandColor || '#2563eb' }}
            >
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.displayName || settings.name || 'Logo workspace'}
                  className="w-full h-full object-cover"
                />
              ) : (
                (settings.displayName || settings.name || 'W').charAt(0).toUpperCase()
              )}
              {canUpdate && (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  title="Thay đổi logo workspace"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Logo Không Gian Làm Việc
              </div>
              <p className="text-[11px] text-slate-500">
                Khuyến nghị tệp PNG hoặc SVG trong suốt, kích thước tối thiểu 256x256 px, tối đa 2MB.
              </p>
              {canUpdate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  isLoading={isUploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                >
                  Tải Ảnh Logo Mới
                </Button>
              )}
            </div>
          </div>

          <FormField>
            <FormLabel required>Tên Hiển Thị Nhận Diện (Display Name)</FormLabel>
            <Input
              value={settings.displayName}
              onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
              disabled={!canUpdate}
              placeholder="Hiển thị tại footer email & trang unsubscribe..."
            />
          </FormField>

          {/* Brand Color Token Selector */}
          <div className="space-y-2">
            <FormLabel>Màu Sắc Thương Hiệu Chủ Đạo</FormLabel>
            <div className="flex items-center gap-3 flex-wrap">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => canUpdate && setSettings({ ...settings, brandColor: c.value })}
                  className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition cursor-pointer select-none ${
                    settings.brandColor === c.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${c.bgClass} shrink-0`} />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {c.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================= SECTION 3: PREFERENCES & COMPLIANCE ================= */}
      <Card className="border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm">Tùy Chọn Mặc Định & Tuân Thủ (Preferences)</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Cấu hình múi giờ phát hành, địa chỉ người gửi mặc định và các tiêu chuẩn bảo mật.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel>Múi Giờ Mặc Định (Default Timezone)</FormLabel>
              <SimpleSelect
                value={settings.timezone}
                onValueChange={(val) => setSettings({ ...settings, timezone: val })}
                disabled={!canUpdate}
                options={[
                  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (UTC+07:00 - Việt Nam / Thái Lan)' },
                  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+08:00)' },
                  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+09:00 - Nhật Bản)' },
                  { value: 'UTC', label: 'UTC (UTC+00:00 - Tiêu chuẩn quốc tế)' },
                ]}
              />
            </FormField>

            <FormField>
              <FormLabel>Người Gửi Mặc Định Cho Chiến Dịch Mới</FormLabel>
              <select
                value={settings.defaultSenderId || ''}
                onChange={(e) => setSettings({ ...settings, defaultSenderId: e.target.value })}
                disabled
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus-ring"
              >
                <option value="">Sẽ cấu hình sau khi có người gửi</option>
              </select>
            </FormField>
          </div>

          {/* Tracking Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.enableOpenTracking}
                onChange={(e) =>
                  canUpdate && setSettings({ ...settings, enableOpenTracking: e.target.checked })
                }
                disabled={!canUpdate}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Bật tính năng theo dõi tỷ lệ mở thư (Open Tracking Pixel)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.enableClickTracking}
                onChange={(e) =>
                  canUpdate && setSettings({ ...settings, enableClickTracking: e.target.checked })
                }
                disabled={!canUpdate}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Bật tính năng theo dõi nhấp liên kết (Click CTR Tracking)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.enforceRfc8058}
                onChange={(e) =>
                  canUpdate && setSettings({ ...settings, enforceRfc8058: e.target.checked })
                }
                disabled={!canUpdate}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Bắt buộc tiêu đề chuẩn RFC 8058 (1-Click List-Unsubscribe Header)
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* ================= SECTION 4: DANGER ZONE ================= */}
      <Card className="border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs">
        <CardHeader className="pb-3 border-b border-rose-200 dark:border-rose-900/40">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <CardTitle className="text-sm">Vùng Nguy Hiểm (Danger Zone)</CardTitle>
          </div>
          <CardDescription className="text-xs text-rose-800/80 dark:text-rose-400">
            Các hành động nhạy cảm có khả năng xóa dữ liệu vĩnh viễn. Chỉ có Chủ sở hữu (Owner) mới có quyền thực hiện.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-rose-900 dark:text-rose-200">
              Xóa Vĩnh Viễn Không Gian Làm Việc Này
            </div>
            <p className="text-rose-800/80 dark:text-rose-400 text-[11px] max-w-xl leading-relaxed">
              Toàn bộ danh bạ, chiến dịch email, báo cáo, khóa API và các bản ghi cấu hình DNS của tổ chức sẽ bị hủy hoàn toàn và không thể khôi phục.
            </p>
          </div>

          <div className="shrink-0">
            {canDelete ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 font-bold shadow-md shadow-rose-600/20"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => setIsDeleteOpen(true)}
              >
                Xóa Workspace
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Chỉ Owner có quyền xóa</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isLogoConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !isUploadingLogo) {
            closeLogoConfirmDialog()
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <UploadCloud className="w-5 h-5" />
              <DialogTitle>Xác Nhận Đổi Logo Workspace</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Vui lòng kiểm tra lại logo mới trước khi tải lên máy chủ Cloudinary.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 flex flex-col items-center justify-center gap-3">
            <div
              className="relative w-28 h-28 rounded-2xl border-4 border-blue-500/20 dark:border-blue-400/20 shadow-xl overflow-hidden flex items-center justify-center ring-4 ring-blue-500/10 text-white font-extrabold text-3xl"
              style={{ backgroundColor: settings.brandColor || '#2563eb' }}
            >
              {pendingLogoPreviewUrl ? (
                <img
                  src={pendingLogoPreviewUrl}
                  alt="Xem trước logo workspace mới"
                  className="w-full h-full object-cover"
                />
              ) : (
                (settings.displayName || settings.name || 'W').charAt(0).toUpperCase()
              )}
            </div>

            {pendingLogoFile && (
              <div className="text-center space-y-0.5">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                  {pendingLogoFile.name}
                </p>
                <p className="text-[11px] font-mono text-slate-400">
                  Kích thước: {formatFileSize(pendingLogoFile.size)} •{' '}
                  {pendingLogoFile.type.replace('image/', '').replace('+xml', '').toUpperCase()}
                </p>
              </div>
            )}

            <div className="w-full p-2.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/70 dark:border-blue-800/60 text-center">
              <p className="text-[11px] text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Logo sẽ hiển thị ngay trên switcher workspace và trang cài đặt.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploadingLogo}
              onClick={closeLogoConfirmDialog}
            >
              Hủy Bỏ
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 font-bold"
              isLoading={isUploadingLogo}
              onClick={() => void handleConfirmUploadLogo()}
            >
              Lưu Logo Mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteWorkspaceConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        workspaceName={settings.name}
        onConfirmDelete={handleDeleteWorkspace}
      />
    </div>
  )
}

export default WorkspaceSettingsPage
