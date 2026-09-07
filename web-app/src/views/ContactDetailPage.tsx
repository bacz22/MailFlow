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
  Activity,
  Send,
  Layers,
} from 'lucide-react'
import { ContactStatusBadge } from '../components/contacts/ContactStatusBadge'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/Dialog'
import { PermissionGate, PERMISSIONS } from '../permissions'
import { AddToListDialog } from '../components/contacts/AddToListDialog'
import { AssignTagsDialog } from '../components/contacts/AssignTagsDialog'
import { useToast } from '../components/ui/Toast'
import { ApiError } from '../services/apiClient'
import { contactService } from '../services/contact.service'
import { listService } from '../services/list.service'
import { analyticsService, type EngagementEventItem } from '../services/analytics.service'
import type { Contact } from '../types/contact.types'
import type { AudienceList } from '../types/list.types'

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
  const [isAddToListOpen, setIsAddToListOpen] = useState(false)
  const [isAssignTagsOpen, setIsAssignTagsOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [availableLists, setAvailableLists] = useState<AudienceList[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [engagements, setEngagements] = useState<EngagementEventItem[]>([])
  const [engagementsLoading, setEngagementsLoading] = useState(false)
  const [engagementsError, setEngagementsError] = useState<string | null>(null)

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

  useEffect(() => {
    if (activeTab !== 'activity') return
    let cancelled = false
    setEngagementsLoading(true)
    setEngagementsError(null)
    analyticsService
      .getContactEngagements(contactId, { page: 0, size: 50 })
      .then((page) => {
        if (!cancelled) setEngagements(page.content)
      })
      .catch((error) => {
        if (!cancelled) {
          setEngagementsError(
            error instanceof ApiError ? error.detail : 'Không tải được lịch sử tương tác.'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setEngagementsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeTab, contactId])

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

  const handleDelete = () => {
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!contact) {
      return
    }
    setIsDeleting(true)
    try {
      await contactService.delete(contact.id)
      setIsDeleteOpen(false)
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
    } finally {
      setIsDeleting(false)
    }
  }

  const openAddToList = async () => {
    setIsLoadingLists(true)
    try {
      const lists = await listService.list()
      if (lists.length === 0) {
        showToast({
          type: 'warning',
          title: 'Chưa có danh sách',
          description: 'Tạo danh sách người nhận trước khi gán liên hệ.',
        })
        return
      }
      setAvailableLists(lists)
      setIsAddToListOpen(true)
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tải được danh sách',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsLoadingLists(false)
    }
  }

  const handleConfirmAddToList = async (list: AudienceList) => {
    try {
      await contactService.bulkLists([contact.id], list.id)
      const refreshed = await contactService.get(contact.id)
      setContact(refreshed)
      showToast({
        type: 'success',
        title: 'Đã thêm vào danh sách',
        description: `Đã gán ${contact.fullName} vào "${list.name}".`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không gán được danh sách',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
      throw error
    }
  }

  const handleConfirmAssignTags = async (tags: string[]) => {
    if (!contact) {
      return
    }
    try {
      await contactService.bulkTags([contact.id], tags)
      const refreshed = await contactService.get(contact.id)
      setContact(refreshed)
      showToast({
        type: 'success',
        title: 'Đã gán thẻ',
        description: `Đã gán ${tags.map((tag) => `#${tag}`).join(', ')} cho ${contact.fullName}.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không gán được thẻ',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
      throw error
    }
  }

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
                onClick={() => void openAddToList()}
                isLoading={isLoadingLists}
              >
                Thêm Vào List
              </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSIONS.CONTACT_UPDATE}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Tag className="w-3.5 h-3.5 text-indigo-600" />}
                onClick={() => setIsAssignTagsOpen(true)}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Contact Attributes */}
          <div className="lg:col-span-7 flex flex-col">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base">Thông Tin Chi Tiết</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 text-xs flex-1 flex flex-col justify-between">
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
            {/* <Card>
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
            </Card> */}
          </div>

          {/* Right Column: Engagement Score */}
          <div className="lg:col-span-5 flex flex-col">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-base">Chỉ Số Tương Tác (Engagement Score)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col justify-between gap-4">
                <div className="text-center p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-1">
                  <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                    95 / 100
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Khách Hàng Tương Tác Rất Cao (VIP)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="text-lg font-mono font-bold text-emerald-600">78.5%</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Tỷ Lệ Mở Email</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
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
                  Liên hệ chưa thuộc danh sách nào.
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
            {engagementsLoading && (
              <p className="p-6 text-xs text-slate-500 text-center">Đang tải nhật ký…</p>
            )}
            {engagementsError && (
              <p className="p-6 text-xs text-rose-600 text-center">{engagementsError}</p>
            )}
            {!engagementsLoading && !engagementsError && engagements.length === 0 && (
              <div className="py-10 px-6 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Chưa có tương tác
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Open / click sẽ xuất hiện khi liên hệ mở thư hoặc bấm link trong chiến dịch đã gửi.
                </p>
              </div>
            )}
            {!engagementsLoading && engagements.length > 0 && (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {engagements.map((ev) => (
                  <li key={ev.id} className="px-4 py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={ev.eventType === 'OPEN' ? 'success' : 'default'}
                        className="text-[10px]"
                      >
                        {ev.eventType}
                      </Badge>
                      <span className="text-slate-400 font-mono">
                        {new Date(ev.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-left"
                      onClick={() => onNavigate(`/campaigns/${ev.campaignId}`)}
                    >
                      Chiến dịch {ev.campaignId.slice(0, 8)}…
                    </button>
                    {ev.targetUrl && (
                      <div className="text-slate-500 truncate" title={ev.targetUrl}>
                        {ev.targetUrl}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
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

      <AddToListDialog
        isOpen={isAddToListOpen}
        onClose={() => setIsAddToListOpen(false)}
        lists={availableLists}
        contactCount={1}
        onConfirm={handleConfirmAddToList}
      />

      <AssignTagsDialog
        isOpen={isAssignTagsOpen}
        onClose={() => setIsAssignTagsOpen(false)}
        contactCount={1}
        availableTags={contact.tags}
        onConfirm={handleConfirmAssignTags}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setIsDeleteOpen(false)
          }
        }}
        title="Xóa liên hệ vĩnh viễn?"
        description={`Bạn sắp xóa "${contact.fullName}" khỏi danh bạ. Hành động này không thể hoàn tác.`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}

export default ContactDetailPage
