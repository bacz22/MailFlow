import type { BreakpointConfig, RoleConfig } from '../types/design-system'

export const BREAKPOINTS: Record<string, BreakpointConfig> = {
  sm: {
    name: 'sm',
    minWidth: 640,
    label: 'Mobile / Tablet Portrait',
    targetDevice: '< 768px',
    gutter: '16px (px-4)',
  },
  md: {
    name: 'md',
    minWidth: 768,
    label: 'Tablet Landscape',
    targetDevice: '768px - 1023px',
    gutter: '16px (px-4)',
  },
  lg: {
    name: 'lg',
    minWidth: 1024,
    label: 'Small Laptop',
    targetDevice: '1024px - 1279px',
    gutter: '20px (px-5)',
  },
  xl: {
    name: 'xl',
    minWidth: 1280,
    label: 'HD Laptop (1366 × 768)',
    targetDevice: '1280px - 1535px',
    gutter: '20px - 24px (px-5/px-6)',
  },
  '2xl': {
    name: '2xl',
    minWidth: 1536,
    label: 'Full HD Laptop / Desktop (1920 × 1080)',
    targetDevice: '1536px - 2047px',
    gutter: '24px - 32px (px-6/px-8)',
  },
  '3xl': {
    name: '3xl',
    minWidth: 2048,
    label: '2K Desktop (2560 × 1440)',
    targetDevice: '>= 2048px',
    gutter: '32px - 40px (px-8/px-10)',
  },
}

export const CONTAINER_MAX_WIDTHS = {
  narrow: 'max-w-3xl', // ~768px: Profile, Simple Forms, Settings
  default: 'max-w-7xl', // ~1280px: Detailed Forms, Template Previews
  wide: 'max-w-[1600px]', // ~1600px: Dashboard, Analytics, Workflow Builder
  full: 'w-full', // 100%: Contacts Data Table, Campaign Logs
} as const

export const WORKSPACE_ROLES: RoleConfig[] = [
  {
    id: 'OWNER',
    name: 'Chủ sở hữu (Owner)',
    description: 'Toàn quyền quản trị tài khoản, thanh toán, bảo mật và các thành viên.',
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    allowedRoutes: ['*'],
  },
  {
    id: 'ADMIN',
    name: 'Quản trị viên (Admin)',
    description: 'Quản lý thành viên, cấu hình domain, gửi chiến dịch và xem báo cáo.',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    allowedRoutes: ['*'],
  },
  {
    id: 'MARKETING_MANAGER',
    name: 'Marketing Manager',
    description: 'Phê duyệt chiến dịch, quản lý mẫu email, tạo chiến dịch và xem analytics.',
    badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    allowedRoutes: ['/dashboard', '/campaigns', '/templates', '/contacts', '/analytics', '/reports'],
  },
  {
    id: 'CAMPAIGN_EDITOR',
    name: 'Campaign Editor',
    description: 'Tạo và chỉnh sửa nội dung chiến dịch, template email, gửi yêu cầu duyệt.',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    allowedRoutes: ['/dashboard', '/campaigns', '/templates'],
  },
  {
    id: 'CONTACT_MANAGER',
    name: 'Contact Manager',
    description: 'Quản lý danh bạ, phân đoạn khách hàng (segments), nhập xuất file CSV/Excel.',
    badgeColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    allowedRoutes: ['/dashboard', '/contacts', '/lists', '/segments'],
  },
  {
    id: 'ANALYST',
    name: 'Data Analyst',
    description: 'Truy cập chuyên sâu vào báo cáo, thống kê hiệu suất open/click/bounce.',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    allowedRoutes: ['/dashboard', '/analytics', '/reports'],
  },
  {
    id: 'BILLING_MANAGER',
    name: 'Billing Manager',
    description: 'Quản lý gói cước, hóa đơn VAT, phương thức thanh toán và hạn ngạch email.',
    badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    allowedRoutes: ['/dashboard', '/billing', '/settings/usage'],
  },
  {
    id: 'VIEWER',
    name: 'Người xem (Viewer)',
    description: 'Chỉ xem dữ liệu ở chế độ Read-only, không thể chỉnh sửa hay gửi chiến dịch.',
    badgeColor: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
    allowedRoutes: ['/dashboard', '/campaigns', '/analytics'],
  },
]
