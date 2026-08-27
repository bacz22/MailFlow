/**
 * MailFlow 8 Standard Workspace Roles Definitions & Metadata
 */

export const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MARKETING_MANAGER: 'MARKETING_MANAGER',
  CAMPAIGN_EDITOR: 'CAMPAIGN_EDITOR',
  CONTACT_MANAGER: 'CONTACT_MANAGER',
  ANALYST: 'ANALYST',
  BILLING_MANAGER: 'BILLING_MANAGER',
  VIEWER: 'VIEWER',
} as const

export type WorkspaceRole = (typeof ROLES)[keyof typeof ROLES]

export interface RoleMetadata {
  id: WorkspaceRole
  name: string
  titleVn: string
  description: string
  badgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  badgeColor: string
  priority: number // Hierarchy level (1 is highest)
}

export const ROLES_METADATA: Record<WorkspaceRole, RoleMetadata> = {
  OWNER: {
    id: ROLES.OWNER,
    name: 'Owner',
    titleVn: 'Chủ Sở Hữu',
    description: 'Toàn quyền kiểm soát cao nhất với workspace, tài chính và cấu hình nhạy cảm.',
    badgeVariant: 'danger',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    priority: 1,
  },
  ADMIN: {
    id: ROLES.ADMIN,
    name: 'Administrator',
    titleVn: 'Quản Trị Viên',
    description: 'Quản trị hầu hết cấu hình hệ thống, thành viên và hạ tầng gửi email.',
    badgeVariant: 'default',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    priority: 2,
  },
  MARKETING_MANAGER: {
    id: ROLES.MARKETING_MANAGER,
    name: 'Marketing Manager',
    titleVn: 'Trưởng Nhóm Marketing',
    description: 'Quản lý toàn bộ chiến dịch, phê duyệt gửi email, quản lý danh bạ và xem báo cáo.',
    badgeVariant: 'info',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    priority: 3,
  },
  CAMPAIGN_EDITOR: {
    id: ROLES.CAMPAIGN_EDITOR,
    name: 'Campaign Editor',
    titleVn: 'Biên Tập Viên Chiến Dịch',
    description: 'Soạn thảo nội dung email, thiết kế mẫu templates và tạo bản nháp chiến dịch.',
    badgeVariant: 'warning',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    priority: 4,
  },
  CONTACT_MANAGER: {
    id: ROLES.CONTACT_MANAGER,
    name: 'Contact Manager',
    titleVn: 'Quản Lý Danh Bạ',
    description: 'Nhập/xuất danh bạ, phân đoạn khách hàng và quản lý danh sách người nhận.',
    badgeVariant: 'success',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    priority: 5,
  },
  ANALYST: {
    id: ROLES.ANALYST,
    name: 'Data Analyst',
    titleVn: 'Chuyên Viên Phân Tích',
    description: 'Xem số liệu phân tích, xuất báo cáo hiệu suất và tỷ lệ chuyển đổi.',
    badgeVariant: 'neutral',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    priority: 6,
  },
  BILLING_MANAGER: {
    id: ROLES.BILLING_MANAGER,
    name: 'Billing Manager',
    titleVn: 'Quản Lý Thanh Toán',
    description: 'Quản lý các khoản thanh toán, nâng cấp gói cước và theo dõi hóa đơn.',
    badgeVariant: 'warning',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    priority: 7,
  },
  VIEWER: {
    id: ROLES.VIEWER,
    name: 'Viewer',
    titleVn: 'Người Xem',
    description: 'Chỉ xem dữ liệu, báo cáo cơ bản, không có quyền chỉnh sửa hoặc gửi email.',
    badgeVariant: 'neutral',
    badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    priority: 8,
  },
}

export const ALL_ROLES_LIST: RoleMetadata[] = Object.values(ROLES_METADATA).sort(
  (a, b) => a.priority - b.priority
)
