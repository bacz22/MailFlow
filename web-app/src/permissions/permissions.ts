/**
 * MailFlow Atomic Permissions Definitions
 * Granular, capability-based permission constants.
 */

export const PERMISSIONS = {
  // 1. Dashboard
  DASHBOARD_READ: 'DASHBOARD_READ',

  // 2. Audience - Contacts
  CONTACT_READ: 'CONTACT_READ',
  CONTACT_CREATE: 'CONTACT_CREATE',
  CONTACT_UPDATE: 'CONTACT_UPDATE',
  CONTACT_DELETE: 'CONTACT_DELETE',
  CONTACT_IMPORT: 'CONTACT_IMPORT',
  CONTACT_EXPORT: 'CONTACT_EXPORT',

  // 3. Audience - Lists
  LIST_READ: 'LIST_READ',
  LIST_CREATE: 'LIST_CREATE',
  LIST_UPDATE: 'LIST_UPDATE',
  LIST_DELETE: 'LIST_DELETE',

  // 4. Audience - Segments
  SEGMENT_READ: 'SEGMENT_READ',
  SEGMENT_CREATE: 'SEGMENT_CREATE',
  SEGMENT_UPDATE: 'SEGMENT_UPDATE',
  SEGMENT_DELETE: 'SEGMENT_DELETE',

  // 5. Campaigns - Templates
  TEMPLATE_READ: 'TEMPLATE_READ',
  TEMPLATE_CREATE: 'TEMPLATE_CREATE',
  TEMPLATE_UPDATE: 'TEMPLATE_UPDATE',
  TEMPLATE_DELETE: 'TEMPLATE_DELETE',

  // 6. Campaigns - Campaigns & Dispatch Workflow
  CAMPAIGN_READ: 'CAMPAIGN_READ',
  CAMPAIGN_CREATE: 'CAMPAIGN_CREATE',
  CAMPAIGN_UPDATE: 'CAMPAIGN_UPDATE',
  CAMPAIGN_DELETE: 'CAMPAIGN_DELETE',
  CAMPAIGN_SEND_TEST: 'CAMPAIGN_SEND_TEST',
  CAMPAIGN_SUBMIT: 'CAMPAIGN_SUBMIT',
  CAMPAIGN_APPROVE: 'CAMPAIGN_APPROVE',
  CAMPAIGN_REJECT: 'CAMPAIGN_REJECT',
  CAMPAIGN_SEND: 'CAMPAIGN_SEND',
  CAMPAIGN_PAUSE: 'CAMPAIGN_PAUSE',
  CAMPAIGN_CANCEL: 'CAMPAIGN_CANCEL',

  // 7. Analytics & Reports
  ANALYTICS_READ: 'ANALYTICS_READ',
  ANALYTICS_EXPORT: 'ANALYTICS_EXPORT',

  // 8. Management - Members
  MEMBER_READ: 'MEMBER_READ',
  MEMBER_INVITE: 'MEMBER_INVITE',
  MEMBER_UPDATE: 'MEMBER_UPDATE',
  MEMBER_DELETE: 'MEMBER_DELETE',

  // 9. Settings - Senders
  SENDER_READ: 'SENDER_READ',
  SENDER_MANAGE: 'SENDER_MANAGE',

  // 10. Settings - Domains
  DOMAIN_READ: 'DOMAIN_READ',
  DOMAIN_MANAGE: 'DOMAIN_MANAGE',

  // 11. Settings - Billing & Quotas
  BILLING_READ: 'BILLING_READ',
  BILLING_MANAGE: 'BILLING_MANAGE',

  // 12. Settings - Workspace
  WORKSPACE_READ: 'WORKSPACE_READ',
  WORKSPACE_UPDATE: 'WORKSPACE_UPDATE',
  WORKSPACE_DELETE: 'WORKSPACE_DELETE',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export interface PermissionGroupMeta {
  id: string
  name: string
  description: string
  permissions: Permission[]
}

export const PERMISSION_GROUPS: PermissionGroupMeta[] = [
  {
    id: 'dashboard',
    name: 'Tổng Quan & Dashboard',
    description: 'Xem số liệu thống kê tổng thể và báo cáo nhanh',
    permissions: [PERMISSIONS.DASHBOARD_READ],
  },
  {
    id: 'contacts',
    name: 'Danh Bạ & Liên Hệ',
    description: 'Xem, tạo, chỉnh sửa, xóa, nhập và xuất danh bạ email',
    permissions: [
      PERMISSIONS.CONTACT_READ,
      PERMISSIONS.CONTACT_CREATE,
      PERMISSIONS.CONTACT_UPDATE,
      PERMISSIONS.CONTACT_DELETE,
      PERMISSIONS.CONTACT_IMPORT,
      PERMISSIONS.CONTACT_EXPORT,
    ],
  },
  {
    id: 'lists_segments',
    name: 'Danh Sách & Phân Đoạn',
    description: 'Tạo và quản lý danh sách tĩnh và phân đoạn động',
    permissions: [
      PERMISSIONS.LIST_READ,
      PERMISSIONS.LIST_CREATE,
      PERMISSIONS.LIST_UPDATE,
      PERMISSIONS.LIST_DELETE,
      PERMISSIONS.SEGMENT_READ,
      PERMISSIONS.SEGMENT_CREATE,
      PERMISSIONS.SEGMENT_UPDATE,
      PERMISSIONS.SEGMENT_DELETE,
    ],
  },
  {
    id: 'templates',
    name: 'Mẫu Email (Templates)',
    description: 'Tạo, biên tập và quản lý thư viện mẫu email',
    permissions: [
      PERMISSIONS.TEMPLATE_READ,
      PERMISSIONS.TEMPLATE_CREATE,
      PERMISSIONS.TEMPLATE_UPDATE,
      PERMISSIONS.TEMPLATE_DELETE,
    ],
  },
  {
    id: 'campaigns',
    name: 'Chiến Dịch & Quy Trình Gửi',
    description: 'Khởi tạo, duyệt chiến dịch, gửi thử nghiệm, gửi thật và tạm dừng',
    permissions: [
      PERMISSIONS.CAMPAIGN_READ,
      PERMISSIONS.CAMPAIGN_CREATE,
      PERMISSIONS.CAMPAIGN_UPDATE,
      PERMISSIONS.CAMPAIGN_DELETE,
      PERMISSIONS.CAMPAIGN_SEND_TEST,
      PERMISSIONS.CAMPAIGN_SUBMIT,
      PERMISSIONS.CAMPAIGN_APPROVE,
      PERMISSIONS.CAMPAIGN_REJECT,
      PERMISSIONS.CAMPAIGN_SEND,
      PERMISSIONS.CAMPAIGN_PAUSE,
      PERMISSIONS.CAMPAIGN_CANCEL,
    ],
  },
  {
    id: 'analytics',
    name: 'Báo Cáo & Phân Tích',
    description: 'Xem biểu đồ phân tích tương tác và xuất file báo cáo',
    permissions: [PERMISSIONS.ANALYTICS_READ, PERMISSIONS.ANALYTICS_EXPORT],
  },
  {
    id: 'members',
    name: 'Thành Viên & Phân Quyền',
    description: 'Mời thành viên, gán vai trò và xóa người dùng khỏi workspace',
    permissions: [
      PERMISSIONS.MEMBER_READ,
      PERMISSIONS.MEMBER_INVITE,
      PERMISSIONS.MEMBER_UPDATE,
      PERMISSIONS.MEMBER_DELETE,
    ],
  },
  {
    id: 'infrastructure',
    name: 'Hạ Tầng Gửi (Senders & Domains)',
    description: 'Quản lý địa chỉ người gửi, cấu hình DNS DKIM/SPF/DMARC',
    permissions: [
      PERMISSIONS.SENDER_READ,
      PERMISSIONS.SENDER_MANAGE,
      PERMISSIONS.DOMAIN_READ,
      PERMISSIONS.DOMAIN_MANAGE,
    ],
  },
  {
    id: 'workspace_billing',
    name: 'Gói Cước & Không Gian Làm Việc',
    description: 'Thanh toán, mua hạn ngạch và cấu hình workspace',
    permissions: [
      PERMISSIONS.BILLING_READ,
      PERMISSIONS.BILLING_MANAGE,
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.WORKSPACE_UPDATE,
      PERMISSIONS.WORKSPACE_DELETE,
    ],
  },
]
