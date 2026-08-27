import React, { useState } from 'react'
import {
  UserPlus,
  Search,
  Crown,
  AlertTriangle,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { MemberTable } from '../components/members/MemberTable'
import { InviteMemberDialog } from '../components/members/InviteMemberDialog'
import { ChangeRoleDialog } from '../components/members/ChangeRoleDialog'
import { RemoveMemberDialog } from '../components/members/RemoveMemberDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { usePermission, PERMISSIONS } from '../permissions'
import type { WorkspaceMember } from '../types/member.types'
import type { WorkspaceRole } from '../permissions/roles'

const INITIAL_MEMBERS: WorkspaceMember[] = [
  {
    id: 'mem-1',
    name: 'Nguyễn Văn Admin',
    email: 'admin@mailflow.vn',
    role: 'OWNER',
    status: 'ACTIVE',
    joinedAt: '01/01/2026',
    lastActiveAt: 'Vừa xong',
    isCurrentUser: true,
  },
  {
    id: 'mem-2',
    name: 'Trần Minh Marketing',
    email: 'marketing.manager@mailflow.vn',
    role: 'MARKETING_MANAGER',
    status: 'ACTIVE',
    joinedAt: '10/01/2026',
    lastActiveAt: '10 phút trước',
  },
  {
    id: 'mem-3',
    name: 'Lê Hoàng Editor',
    email: 'editor@mailflow.vn',
    role: 'CAMPAIGN_EDITOR',
    status: 'ACTIVE',
    joinedAt: '15/02/2026',
    lastActiveAt: '1 giờ trước',
  },
  {
    id: 'mem-4',
    name: 'Phạm Thu Data Analyst',
    email: 'analyst@mailflow.vn',
    role: 'ANALYST',
    status: 'ACTIVE',
    joinedAt: '01/03/2026',
    lastActiveAt: 'Hôm qua',
  },
  {
    id: 'mem-5',
    name: 'Vũ Đức Thành (Audience Lead)',
    email: 'contacts.lead@mailflow.vn',
    role: 'CONTACT_MANAGER',
    status: 'ACTIVE',
    joinedAt: '12/04/2026',
    lastActiveAt: '3 ngày trước',
  },
  {
    id: 'mem-6',
    name: 'Đặng Thanh Thảo',
    email: 'thao.dang@partner.com',
    role: 'CAMPAIGN_EDITOR',
    status: 'PENDING',
    joinedAt: '25/08/2026',
    lastActiveAt: 'Chờ chấp nhận',
  },
]

export interface MembersPageProps {
  onNavigate: (path: string) => void
}

export const MembersPage: React.FC<MembersPageProps> = ({ onNavigate: _onNavigate }) => {
  const { showToast } = useToast()
  const { hasPermission } = usePermission()

  const [members, setMembers] = useState<WorkspaceMember[]>(INITIAL_MEMBERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Modal dialog states
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [selectedMemberForRole, setSelectedMemberForRole] = useState<WorkspaceMember | null>(null)
  const [selectedMemberForRemove, setSelectedMemberForRemove] = useState<WorkspaceMember | null>(null)
  const [selectedMemberForTransfer, setSelectedMemberForTransfer] = useState<WorkspaceMember | null>(null)

  const canInvite = hasPermission(PERMISSIONS.MEMBER_INVITE)

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    if (roleFilter !== 'all' && m.role !== roleFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  })

  // Handlers
  const handleInviteMember = (email: string, role: WorkspaceRole) => {
    const newMember: WorkspaceMember = {
      id: `mem-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role,
      status: 'PENDING',
      joinedAt: new Date().toLocaleDateString('vi-VN'),
      lastActiveAt: 'Chờ chấp nhận',
    }

    setMembers((prev) => [...prev, newMember])
    showToast({
      type: 'success',
      title: 'Đã gửi thư mời',
      description: `Đã gửi liên kết mời tham gia tới email ${email} với vai trò ${role}.`,
    })
  }

  const handleChangeRole = (memberId: string, newRole: WorkspaceRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    )
    showToast({
      type: 'success',
      title: 'Đã cập nhật vai trò',
      description: `Vai trò của thành viên đã được chuyển đổi thành ${newRole}.`,
    })
  }

  const handleRemoveMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
    showToast({
      type: 'success',
      title: 'Đã xóa thành viên',
      description: 'Thành viên đã bị thu hồi toàn bộ quyền truy cập.',
    })
  }

  const handleResendInvite = (member: WorkspaceMember) => {
    showToast({
      type: 'success',
      title: 'Đã gửi lại thư mời',
      description: `Email thư mời đã được gửi lại tới ${member.email}.`,
    })
  }

  const handleCancelInvite = (member: WorkspaceMember) => {
    setMembers((prev) => prev.filter((m) => m.id !== member.id))
    showToast({
      type: 'info',
      title: 'Đã hủy lời mời',
      description: `Lời mời gửi tới ${member.email} đã được hủy bỏ.`,
    })
  }

  const handleTransferOwnership = (member: WorkspaceMember) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === member.id) return { ...m, role: 'OWNER' }
        if (m.role === 'OWNER') return { ...m, role: 'ADMIN' }
        return m
      })
    )
    setSelectedMemberForTransfer(null)
    showToast({
      type: 'success',
      title: 'Đã chuyển quyền Owner',
      description: `${member.name} hiện là Chủ sở hữu (Owner) mới của Workspace.`,
    })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header with Invite Action */}
      <PageHeader
        title="Quản Lý Thành Viên & Phân Quyền (Team & Roles)"
        description="Phân bổ và kiểm soát vai trò chặt chẽ theo mô hình RBAC 8 cấp độ phân quyền (Owner, Admin, Manager, Editor, Analyst, Billing, Viewer)."
        actions={
          canInvite && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsInviteOpen(true)}
            >
              Mời Thành Viên Mới
            </Button>
          )
        }
      />

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Tổng Thành Viên</div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
            {members.length}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">Gói Doanh Nghiệp (Không giới hạn)</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Đang Hoạt Động</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-600">
            {members.filter((m) => m.status === 'ACTIVE').length}
          </div>
          <div className="text-[10px] text-slate-400">Đã xác thực 2FA</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Lời Mời Chờ Kích Hoạt</div>
          <div className="text-2xl font-extrabold font-mono text-amber-600">
            {members.filter((m) => m.status === 'PENDING').length}
          </div>
          <div className="text-[10px] text-slate-400">Hiệu lực trong 7 ngày</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Cấp Độ Quản Trị</div>
          <div className="text-2xl font-extrabold font-mono text-blue-600">
            {members.filter((m) => m.role === 'OWNER' || m.role === 'ADMIN').length}
          </div>
          <div className="text-[10px] text-blue-600 font-medium">Owner & Quản trị viên</div>
        </div>
      </div>

      {/* 3. Filter Controls & Member Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Danh Sách Thành Viên Tổ Chức</CardTitle>
            <CardDescription className="text-xs">
              Kiểm tra trạng thái tài khoản và điều chỉnh vai trò cấp quyền truy cập.
            </CardDescription>
          </div>

          {/* Search & Role Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus-ring cursor-pointer"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MARKETING_MANAGER">Marketing Manager</option>
              <option value="CAMPAIGN_EDITOR">Campaign Editor</option>
              <option value="CONTACT_MANAGER">Contact Manager</option>
              <option value="ANALYST">Analyst</option>
              <option value="BILLING_MANAGER">Billing Manager</option>
              <option value="VIEWER">Viewer</option>
            </select>

            <div className="w-full sm:w-64">
              <Input
                placeholder="Tìm theo tên hoặc email..."
                leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <MemberTable
            members={filteredMembers}
            currentUserRole="OWNER"
            onChangeRole={(m) => setSelectedMemberForRole(m)}
            onRemoveMember={(m) => setSelectedMemberForRemove(m)}
            onResendInvite={handleResendInvite}
            onCancelInvite={handleCancelInvite}
            onTransferOwnership={(m) => setSelectedMemberForTransfer(m)}
          />
        </CardContent>
      </Card>

      {/* DIALOGS */}
      {/* 1. Invite Member Dialog */}
      <InviteMemberDialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInviteMember}
      />

      {/* 2. Change Role Dialog */}
      <ChangeRoleDialog
        isOpen={!!selectedMemberForRole}
        onClose={() => setSelectedMemberForRole(null)}
        member={selectedMemberForRole}
        onConfirmChange={handleChangeRole}
      />

      {/* 3. Remove Member Dialog */}
      <RemoveMemberDialog
        isOpen={!!selectedMemberForRemove}
        onClose={() => setSelectedMemberForRemove(null)}
        member={selectedMemberForRemove}
        onConfirmRemove={handleRemoveMember}
      />

      {/* 4. Transfer Ownership Confirmation Dialog */}
      <Dialog
        open={!!selectedMemberForTransfer}
        onOpenChange={() => setSelectedMemberForTransfer(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <Crown className="w-5 h-5" />
              <DialogTitle>Chuyển Quyền Chủ Sở Hữu (Ownership)</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Bạn có chắc chắn muốn chuyển giao toàn bộ quyền Owner Workspace cho thành viên{' '}
              <strong>{selectedMemberForTransfer?.name}</strong> không?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cảnh Báo Quản Trị:</span>
            </div>
            <p className="text-[11px] leading-relaxed pl-5">
              Sau khi chuyển giao, vai trò của bạn sẽ tự động chuyển thành <strong>Admin</strong>. Bạn sẽ không thể tự chuyển lại quyền Owner nếu không được Owner mới cấp phép.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMemberForTransfer(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 font-bold"
              onClick={() => {
                if (selectedMemberForTransfer) {
                  handleTransferOwnership(selectedMemberForTransfer)
                }
              }}
            >
              Xác Nhận Chuyển Quyền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MembersPage
