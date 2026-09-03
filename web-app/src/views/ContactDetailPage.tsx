import React, { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Edit3,
  ListPlus,
  Tag,
  Trash2,
  Copy,
  Check,
  Mail,
  Building2,
  ShieldCheck,
  Activity,
  Send,
  MousePointerClick,
  Eye,
  Layers,
} from 'lucide-react'
import { ContactStatusBadge } from '../components/contacts/ContactStatusBadge'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { PermissionGate, PERMISSIONS } from '../permissions'
import { useToast } from '../components/ui/Toast'
import { ApiError } from '../services/apiClient'
import { contactService } from '../services/contact.service'
import type { Contact } from '../types/contact.types'

export interface ContactDetailPageProps {
  contactId: string
  onNavigate: (path: string) => void
}

export const ContactDetailPage: React.FC<ContactDetailPageProps> = ({
  contactId,
  onNavigate,
}) => {
  const { showToast } = useToast()
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'lists_tags' | 'activity' | 'custom_fields'>('overview')
  const [contact, setContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    contactService
      .get(contactId)
      .then((data) => {
        if (!cancelled) setContact(data)
      })
      .catch((error) => {
        if (cancelled) return
        showToast({
          type: 'error',
          title: 'Không tải được liên hệ',
          description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
        })
        onNavigate('/contacts')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [contactId, onNavigate, showToast])

  if (isLoading || !contact) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => onNavigate('/contacts')}
        >
          Quay Lại Danh Bạ
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            Đang tải hồ sơ liên hệ...
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contact.email)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
    showToast({
      type: 'success',
      title: 'Đã sao chép email',
      description: contact.email,
    })
  }

  const handleDelete = async () => {
    if (!window.confirm(`Xóa vĩnh viễn liên hệ ${contact.fullName}?`)) {
      return
    }
    try {
      await contactService.delete(contact.id)
      showToast({
        type: 'warning',
        title: 'Đã xóa liên hệ',
        description: `Đã xóa vĩnh viễn ${contact.fullName} khỏi hệ thống.`,
      })
      onNavigate('/contacts')
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không xóa được liên hệ',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    }
  }

  const emailActivities = [
    {
      id: 'act-1',
      campaign: 'Product Launch 2.0 - Early Access',
      subject: '🚀 Ra mắt MailFlow 2.0: Trải nghiệm email marketing đỉnh cao',
      status: 'clicked',
      sentAt: '25/08/2026 10:15',
      openedAt: '25/08/2026 10:22 (3 lượt mở)',
      clickedAt: '25/08/2026 10:25 (Click link: mailflow.vn/pricing)',
    },
    {
      id: 'act-2',
      campaign: 'Weekly Newsletter #48 - AI Automation',
      subject: 'Bản tin hàng tuần: 5 mẹo tối ưu Inbox Rate với RFC 8058',
      status: 'opened',
      sentAt: '24/08/2026 14:00',
      openedAt: '24/08/2026 15:30 (2 lượt mở)',
      clickedAt: '-',
    },
    {
      id: 'act-3',
      campaign: 'Webinar Invitation: Enterprise Email Delivery',
      subject: 'Thư mời: Tối ưu hạ tầng gửi hàng triệu email mỗi ngày',
      status: 'delivered',
      sentAt: '18/08/2026 09:00',
      openedAt: 'Chưa mở',
      clickedAt: '-',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Return button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => onNavigate('/contacts')}
        >
          Quay Lại Danh Bạ
        </Button>
      </div>

      {/* 1. CONTACT DETAIL HERO HEADER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar & Core Profile Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-blue-500/20">
              {contact.firstName.charAt(0)}
              {contact.lastName.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                  {contact.fullName}
                </h1>
                <ContactStatusBadge status={contact.status} size="md" />
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <div className="flex items-center gap-1 font-mono">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{contact.email}</span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-1 hover:text-blue-600 cursor-pointer ml-0.5"
                    title="Sao chép email"
                  >
                    {copiedEmail ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                {contact.company && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{contact.company}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <PermissionGate permission={PERMISSIONS.CONTACT_UPDATE}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit3 className="w-3.5 h-3.5 text-blue-600" />}
                onClick={() => onNavigate(`/contacts/${contact.id}/edit`)}
              >
                Chỉnh Sửa
              </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.CONTACT_UPDATE}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ListPlus className="w-3.5 h-3.5 text-emerald-600" />}
                onClick={() =>
                  showToast({
                    type: 'info',
                    title: 'Thêm vào danh sách',
                    description: `Chọn danh sách cho ${contact.fullName}`,
                  })
                }
              >
                Thêm Vào List
              </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.CONTACT_UPDATE}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Tag className="w-3.5 h-3.5 text-indigo-600" />}
                onClick={() =>
                  showToast({
                    type: 'info',
                    title: 'Gán thẻ tag',
                    description: `Gán thêm thẻ phân loại cho ${contact.fullName}`,
                  })
                }
              >
                Gán Thẻ
              </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.CONTACT_DELETE}>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={handleDelete}
              >
                Xóa
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* 2. NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pt-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Tổng Quan (Overview)' },
            { id: 'lists_tags', label: 'Danh Sách & Thẻ (Lists & Tags)' },
            { id: 'activity', label: 'Lịch Sử Email (Email Activity)' },
            { id: 'custom_fields', label: 'Trường Tùy Chỉnh (Custom Fields)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Contact Attributes */}
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base">Thông Tin Chi Tiết</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Họ và Tên</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{contact.fullName}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Địa chỉ Email</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{contact.email}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Số Điện Thoại</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{contact.phone}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Tổ Chức / Doanh Nghiệp</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{contact.company}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Ngày Tạo Hồ Sơ</span>
                  <span className="font-mono text-slate-500">{contact.createdAt}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Cập Nhật Lần Cuối</span>
                  <span className="font-mono text-slate-500">{contact.updatedAt}</span>
                </div>
              </CardContent>
            </Card>

            {/* Opt-in Compliance Card */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-base">Tuân Thủ Đăng Ký (RFC 8058 Opt-in)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                  <div>
                    <div className="font-bold">Đã Xác Thực Đăng Ký (Double Opt-in)</div>
                    <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400">
                      Được bảo vệ bởi cơ chế hủy đăng ký 1-click List-Unsubscribe
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px]">Hợp lệ</Badge>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                  <div>Nguồn thu thập: <strong>Form Đăng Ký Website (Landing Page)</strong></div>
                  <div>Địa chỉ IP ghi nhận: <code className="font-mono">118.70.124.90 (Hà Nội, VN)</code></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Engagement Score */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-base">Chỉ Số Tương Tác (Engagement Score)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="text-center p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-1">
                  <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                    95 / 100
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Khách Hàng Tương Tác Rất Cao (VIP)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="text-lg font-mono font-bold text-emerald-600">78.5%</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Tỷ Lệ Mở Email</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="text-lg font-mono font-bold text-blue-600">32.0%</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Tỷ Lệ Nhấp (CTR)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: LISTS & TAGS */}
      {activeTab === 'lists_tags' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lists */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-base">Danh Sách Tham Gia ({contact.lists.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {contact.lists.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                  Liên hệ chưa thuộc danh sách nào. Gán danh sách sẽ có ở phase Lists.
                </div>
              ) : (
                contact.lists.map((l, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{l}</div>
                    </div>
                    <Badge variant="default" className="text-[10px]">Đang nhận tin</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-base">Thẻ Phân Khúc (Tags)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold"
                  >
                    <Tag className="w-3 h-3" />
                    <span>#{t}</span>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: EMAIL ACTIVITY */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-base">Lịch Sử Gửi & Tương Tác Email</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Chiến Dịch & Tiêu Đề</th>
                    <th className="py-3 px-3">Trạng Thái</th>
                    <th className="py-3 px-3">Thời Gian Gửi</th>
                    <th className="py-3 px-3">Lượt Mở</th>
                    <th className="py-3 px-3">Lượt Nhấp Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {emailActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{act.campaign}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{act.subject}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            act.status === 'clicked'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : act.status === 'opened'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          }`}
                        >
                          {act.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{act.sentAt}</td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>{act.openedAt}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-1">
                          <MousePointerClick className="w-3.5 h-3.5 text-slate-400" />
                          <span>{act.clickedAt}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: CUSTOM FIELDS */}
      {activeTab === 'custom_fields' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base">Thuộc Tính Mở Rộng (Custom Fields)</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 text-xs pt-1">
            {(contact.customFields ?? []).length === 0 ? (
              <div className="py-6 text-center text-slate-500">
                Chưa có trường tùy chỉnh nào cho liên hệ này.
              </div>
            ) : (
              (contact.customFields ?? []).map((field, idx) => (
                <div key={`${field.key}-${idx}`} className="py-3 flex items-center justify-between">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{field.key}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{field.value || '—'}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ContactDetailPage
