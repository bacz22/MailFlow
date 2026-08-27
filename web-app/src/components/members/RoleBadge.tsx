import React from 'react'
import { ShieldCheck, Crown, UserCheck, Eye, CreditCard, BarChart2, Edit3, Users } from 'lucide-react'
import type { WorkspaceRole } from '../../permissions/roles'

export const ROLE_CONFIGS: Record<WorkspaceRole, {
  label: string
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info'
  icon: React.ReactNode
  description: string
  colorClasses: string
}> = {
  OWNER: {
    label: 'Owner (Chủ Sở Hữu)',
    variant: 'danger',
    icon: <Crown className="w-3.5 h-3.5 text-amber-500" />,
    description: 'Toàn quyền kiểm soát tài khoản, thanh toán và chuyển nhượng Workspace.',
    colorClasses: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900',
  },
  ADMIN: {
    label: 'Admin (Quản Trị Viên)',
    variant: 'default',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />,
    description: 'Quản lý toàn bộ tính năng, thành viên và hạ tầng gửi thư (trừ quyền Owner).',
    colorClasses: 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-900',
  },
  MARKETING_MANAGER: {
    label: 'Marketing Manager',
    variant: 'success',
    icon: <UserCheck className="w-3.5 h-3.5 text-emerald-500" />,
    description: 'Phê duyệt và phát hành chiến dịch, quản lý tệp danh bạ và báo cáo.',
    colorClasses: 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-900',
  },
  CAMPAIGN_EDITOR: {
    label: 'Campaign Editor',
    variant: 'info',
    icon: <Edit3 className="w-3.5 h-3.5 text-indigo-500" />,
    description: 'Soạn thảo nội dung email, thiết kế mẫu thư và gửi yêu cầu phê duyệt.',
    colorClasses: 'bg-indigo-50 text-indigo-900 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-900',
  },
  CONTACT_MANAGER: {
    label: 'Contact Manager',
    variant: 'warning',
    icon: <Users className="w-3.5 h-3.5 text-cyan-500" />,
    description: 'Quản lý danh bạ, nhập/xuất tệp liên hệ và xây dựng phân đoạn động.',
    colorClasses: 'bg-cyan-50 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-200 dark:border-cyan-900',
  },
  ANALYST: {
    label: 'Analyst (Chuyên Viên Số Liệu)',
    variant: 'info',
    icon: <BarChart2 className="w-3.5 h-3.5 text-violet-500" />,
    description: 'Truy cập toàn diện dashboard, theo dõi chỉ số và xuất báo cáo phân tích.',
    colorClasses: 'bg-violet-50 text-violet-900 border-violet-300 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-900',
  },
  BILLING_MANAGER: {
    label: 'Billing Manager',
    variant: 'warning',
    icon: <CreditCard className="w-3.5 h-3.5 text-amber-500" />,
    description: 'Quản lý hóa đơn VAT, gói cước Dedicated IP và phương thức thanh toán.',
    colorClasses: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900',
  },
  VIEWER: {
    label: 'Viewer (Người Xem)',
    variant: 'default',
    icon: <Eye className="w-3.5 h-3.5 text-slate-500" />,
    description: 'Chỉ có quyền xem thông tin cơ bản, không được chỉnh sửa hoặc phát hành.',
    colorClasses: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
}

export interface RoleBadgeProps {
  role: WorkspaceRole
  showIcon?: boolean
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showIcon = true }) => {
  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.VIEWER

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition select-none ${config.colorClasses}`}
    >
      {showIcon && config.icon}
      <span>{config.label.split(' ')[0]}</span>
    </span>
  )
}

export default RoleBadge
