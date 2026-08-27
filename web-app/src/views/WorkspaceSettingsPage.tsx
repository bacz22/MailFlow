import React, { useState } from 'react'
import {
  Building2,
  Palette,
  Sliders,
  AlertTriangle,
  Save,
  Trash2,
  Lock,
  Upload,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { FormField, FormLabel } from '../components/ui/FormGroup'
import { Badge } from '../components/ui/Badge'
import { DeleteWorkspaceConfirmDialog } from '../components/workspace/DeleteWorkspaceConfirmDialog'
import { useToast } from '../components/ui/Toast'
import { usePermission, PERMISSIONS } from '../permissions'
import type { WorkspaceSettings } from '../types/workspace.types'

const INITIAL_SETTINGS: WorkspaceSettings = {
  id: 'ws-1',
  name: 'Acme Marketing Group',
  slug: 'acme-marketing',
  displayName: 'Acme Marketing Solutions',
  brandColor: '#2563eb',
  timezone: 'Asia/Bangkok (UTC+07:00)',
  defaultSenderId: 'snd-1',
  enableOpenTracking: true,
  enableClickTracking: true,
  enforceRfc8058: true,
  industry: 'E-Commerce & SaaS Technology',
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

  const [settings, setSettings] = useState<WorkspaceSettings>(INITIAL_SETTINGS)
  const [initialSettings] = useState<WorkspaceSettings>(INITIAL_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const canUpdate = hasPermission(PERMISSIONS.WORKSPACE_UPDATE)
  const canDelete = hasPermission(PERMISSIONS.WORKSPACE_DELETE)

  // Dirty form check
  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsSaving(false)
    showToast({
      type: 'success',
      title: 'Đã lưu cấu hình Workspace',
      description: 'Các thay đổi thông tin và tùy chọn nhận diện đã được áp dụng toàn hệ thống.',
    })
  }

  const handleDeleteWorkspace = () => {
    showToast({
      type: 'success',
      title: 'Đã xóa không gian làm việc',
      description: 'Tài khoản Workspace đã được xóa hoàn tất. Đang chuyển hướng...',
    })
    setTimeout(() => {
      onNavigate('/login')
    }, 1200)
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
              disabled={!isDirty || isSaving}
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
          {/* Logo Upload Simulation */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0">
              A
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Logo Không Gian Làm Việc
              </div>
              <p className="text-[11px] text-slate-500">
                Khuyến nghị tệp PNG hoặc SVG trong suốt, kích thước tối thiểu 256x256 px.
              </p>
              {canUpdate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  onClick={() =>
                    showToast({
                      type: 'info',
                      title: 'Chọn ảnh logo',
                      description: 'Tính năng tải lên tệp ảnh thương hiệu đang hoạt động.',
                    })
                  }
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
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                disabled={!canUpdate}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus-ring"
              >
                <option value="Asia/Bangkok (UTC+07:00)">Asia/Bangkok (UTC+07:00 - Việt Nam / Thái Lan)</option>
                <option value="Asia/Singapore (UTC+08:00)">Asia/Singapore (UTC+08:00)</option>
                <option value="Asia/Tokyo (UTC+09:00)">Asia/Tokyo (UTC+09:00 - Nhật Bản)</option>
                <option value="UTC (UTC+00:00)">UTC (UTC+00:00 - Tiêu chuẩn quốc tế)</option>
              </select>
            </FormField>

            <FormField>
              <FormLabel>Người Gửi Mặc Định Cho Chiến Dịch Mới</FormLabel>
              <select
                value={settings.defaultSenderId}
                onChange={(e) => setSettings({ ...settings, defaultSenderId: e.target.value })}
                disabled={!canUpdate}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus-ring"
              >
                <option value="snd-1">MailFlow Product Team &lt;newsletter@mailflow.vn&gt; (Verified)</option>
                <option value="snd-2">MailFlow Customer Support &lt;support@mailflow.vn&gt; (Verified)</option>
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
