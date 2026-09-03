import React, { useState, useEffect } from 'react'
import {
  LayoutGrid,
  Plus,
  RefreshCw,
  Users,
  Send,
  FileText,
  BarChart3,
  Globe,
  CreditCard,
  Settings,
  AtSign,
  Layers,
} from 'lucide-react'
import { AppShell } from './components/layout/AppShell'
import { PageHeader } from './components/layout/PageHeader'
import { PageContainer } from './components/layout/PageContainer'
import { DashboardPage } from './views/DashboardPage'
import { ContactsPage } from './views/ContactsPage'
import { ContactCreatePage } from './views/ContactCreatePage'
import { ContactEditPage } from './views/ContactEditPage'
import { ContactDetailPage } from './views/ContactDetailPage'
import { ContactImportWizard } from './views/ContactImportWizard'
import { ListsPage } from './views/ListsPage'
import { ListCreatePage } from './views/ListCreatePage'
import { ListDetailPage } from './views/ListDetailPage'
import { SegmentsPage } from './views/SegmentsPage'
import { SegmentBuilderPage } from './views/SegmentBuilderPage'
import { SegmentDetailPage } from './views/SegmentDetailPage'
import { TemplatesPage } from './views/TemplatesPage'
import { TemplateEditorPage } from './views/TemplateEditorPage'
import { CampaignsPage } from './views/CampaignsPage'
import { CampaignWizardPage } from './views/CampaignWizardPage'
import { CampaignDetailPage } from './views/CampaignDetailPage'
import { CampaignReportPage } from './views/CampaignReportPage'
import { AnalyticsPage } from './views/AnalyticsPage'
import { MembersPage } from './views/MembersPage'
import { SendersPage } from './views/SendersPage'
import { DomainsPage } from './views/DomainsPage'
import { BillingPage } from './views/BillingPage'
import { WorkspaceSettingsPage } from './views/WorkspaceSettingsPage'
import { NotificationsPage } from './views/NotificationsPage'
import { ProfilePage } from './views/ProfilePage'
import { NotificationProvider } from './context/NotificationContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext'
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './views/auth'
import { UnauthorizedPage } from './views/UnauthorizedPage'
import { ToastProvider, useToast } from './components/ui/Toast'
import { Button } from './components/ui/Button'
import { Badge } from './components/ui/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/Card'
import { MetricCard } from './components/ui/MetricCard'
import {
  PermissionProvider,
  usePermission,
  PermissionGate,
  ProtectedRoute,
  PERMISSIONS,
} from './permissions'

// Page route configuration map
interface RouteConfig {
  title: string
  description: string
  section: string
  badgeText?: string
  icon: React.ReactNode
  stats?: { label: string; value: string; trend?: string }[]
}

const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  '/dashboard': {
    title: 'Dashboard Tổng Quan',
    section: 'Tổng quan',
    badgeText: 'Live Data',
    description: 'Tổng hợp chỉ số chiến dịch, tỷ lệ tương tác và hiệu suất gửi email toàn hệ thống.',
    icon: <LayoutGrid className="w-5 h-5 text-blue-600" />,
  },
  '/contacts': {
    title: 'Danh Bạ Liên Hệ (Audience Contacts)',
    section: 'Audience',
    badgeText: '14,250 Contacts',
    description: 'Quản lý danh bạ khách hàng, trạng thái đăng ký (RFC 8058) và điểm tương tác.',
    icon: <Users className="w-5 h-5 text-blue-600" />,
    stats: [
      { label: 'Tổng Liên Hệ Hợp Lệ', value: '14,250', trend: '+8.4%' },
      { label: 'Đã Xác Thực Email', value: '13,820', trend: '97.0%' },
      { label: 'Tỷ Lệ Hủy Đăng Ký', value: '0.04%', trend: '-0.01%' },
      { label: 'Khách Hàng Mới Tuần Này', value: '+342' },
    ],
  },
  '/lists': {
    title: 'Danh Sách Gửi (Contact Lists)',
    section: 'Audience',
    description: 'Tập hợp các danh sách người nhận theo chiến dịch và nguồn đăng ký opt-in.',
    icon: <Users className="w-5 h-5 text-indigo-600" />,
    stats: [
      { label: 'Tổng Số Danh Sách', value: '18 Lists' },
      { label: 'Danh Sách Hoạt Động', value: '14 Active' },
    ],
  },
  '/segments': {
    title: 'Phân Đoạn Động (Audience Segments)',
    section: 'Audience',
    badgeText: 'Dynamic Filter',
    description: 'Bộ lọc phân đoạn khách hàng tự động dựa trên nhân khẩu học và hành vi mở/click email.',
    icon: <Layers className="w-5 h-5 text-violet-600" />,
  },
  '/campaigns': {
    title: 'Chiến Dịch Email (Campaigns)',
    section: 'Chiến dịch',
    badgeText: '3 Live Sending',
    description: 'Khởi tạo, lên lịch gửi và theo dõi realtime tiến trình phân phối email.',
    icon: <Send className="w-5 h-5 text-blue-600" />,
    stats: [
      { label: 'Chiến Dịch Đang Gửi', value: '3 Active' },
      { label: 'Bản Nháp (Drafts)', value: '6 Drafts' },
      { label: 'Đã Hoàn Thành', value: '42 Sent' },
    ],
  },
  '/templates': {
    title: 'Thư Viện Mẫu Email (Templates Library)',
    section: 'Chiến dịch',
    description: 'Quản lý các mẫu email HTML và kéo thả responsive tương thích 100% ứng dụng email.',
    icon: <FileText className="w-5 h-5 text-emerald-600" />,
  },
  '/reports': {
    title: 'Báo Cáo & Phân Tích (Analytics Reports)',
    section: 'Phân tích',
    badgeText: 'Realtime',
    description: 'Báo cáo chi tiết Open Rate, CTR, Heatmap lượt click và tỷ lệ trả về (Bounce).',
    icon: <BarChart3 className="w-5 h-5 text-amber-600" />,
  },
  '/members': {
    title: 'Quản Trị Thành Viên & Phân Quyền (Members)',
    section: 'Quản trị',
    badgeText: '8 Thành Viên',
    description: 'Phân quyền dựa trên 8 Workspace Roles, bảo vệ các hành động nhạy cảm.',
    icon: <Users className="w-5 h-5 text-purple-600" />,
  },
  '/settings/senders': {
    title: 'Cấu Hình Người Gửi (Senders & SMTP)',
    section: 'Cài đặt',
    description: 'Thiết lập địa chỉ email gửi, tên hiển thị thương hiệu và cổng SMTP dedicated.',
    icon: <AtSign className="w-5 h-5 text-slate-600" />,
  },
  '/settings/domains': {
    title: 'Xác Thực Tên Miền (Domain Authentication)',
    section: 'Cài đặt',
    badgeText: 'DKIM • SPF • DMARC',
    description: 'Cấu hình bản ghi DNS để đảm bảo email vào thẳng Inbox chính, tránh tab Spam.',
    icon: <Globe className="w-5 h-5 text-sky-600" />,
  },
  '/settings/billing': {
    title: 'Gói Cước & Thanh Toán (Billing & Quota)',
    section: 'Cài đặt',
    badgeText: 'Enterprise Plan',
    description: 'Quản lý hạn ngạch gửi hàng tháng, thanh toán tự động và lịch sử hóa đơn.',
    icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
  },
  '/settings/workspace': {
    title: 'Cài Đặt Không Gian Làm Việc (Workspace Settings)',
    section: 'Cài đặt',
    description: 'Thông tin tổ chức, múi giờ mặc định (Asia/Ho_Chi_Minh), logo và chính sách bảo mật.',
    icon: <Settings className="w-5 h-5 text-slate-600" />,
  },
}

export function AppContent() {
  const { showToast } = useToast()
  const { loading: authLoading, logout } = useAuth()
  const { roleMetadata } = usePermission()
  const { inviteNotice, clearInviteNotice } = useWorkspace()

  // Track active browser path
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const p = window.location.pathname + window.location.search
    return p === '/' ? '/dashboard' : p
  })

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mailflow_theme') === 'dark'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname + window.location.search
      setCurrentPath(p === '/' ? '/dashboard' : p)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!inviteNotice) {
      return
    }
    showToast(inviteNotice)
    clearInviteNotice()
  }, [inviteNotice, showToast, clearInviteNotice])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('mailflow_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('mailflow_theme', 'light')
    }
  }, [isDark])

  const handleNavigate = (path: string) => {
    setCurrentPath(path)
    window.history.pushState({}, '', path)
  }

  const handleLogout = async () => {
    try {
      await logout()
      showToast({
        type: 'success',
        title: 'Đăng xuất thành công',
        description: 'Bạn đã đăng xuất an toàn khỏi hệ thống.',
      })
    } catch {
      showToast({
        type: 'info',
        title: 'Đã đăng xuất',
        description: 'Phiên làm việc đã kết thúc.',
      })
    } finally {
      handleNavigate('/login')
    }
  }

  // Tách base path bỏ qua query params (?email=... hoặc ?token=...)
  const basePath = currentPath.split('?')[0]

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-sm font-medium text-slate-500">Đang tải phiên làm việc…</div>
      </div>
    )
  }

  // 1. AUTHENTICATION SCREENS (Full-page clean layout)
  if (basePath === '/login') {
    return (
      <LoginPage
        onNavigate={handleNavigate}
        onLoginSuccess={() => handleNavigate('/dashboard')}
      />
    )
  }

  if (basePath === '/register') {
    return (
      <RegisterPage
        onNavigate={handleNavigate}
        onRegisterSuccess={(data) =>
          handleNavigate(`/verify-email?email=${encodeURIComponent(data.email)}`)
        }
      />
    )
  }

  if (basePath === '/forgot-password') {
    return <ForgotPasswordPage onNavigate={handleNavigate} />
  }

  if (basePath === '/reset-password') {
    return <ResetPasswordPage onNavigate={handleNavigate} />
  }

  if (basePath === '/verify-email') {
    return <VerifyEmailPage onNavigate={handleNavigate} />
  }

  if (basePath === '/403') {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
        <UnauthorizedPage onNavigateHome={() => handleNavigate('/dashboard')} />
      </div>
    )
  }

  // 2. MAIN APP SHELL WITH PROTECTED ROUTES
  const currentRoute = ROUTE_CONFIGS[basePath] || ROUTE_CONFIGS['/dashboard']

  const breadcrumbItems = [
    { label: 'MailFlow', href: '#' },
    { label: currentRoute.section, href: '#' },
    { label: currentRoute.title.split('(')[0].trim() },
  ]

  return (
    <AppShell
      currentPath={basePath}
      breadcrumbs={breadcrumbItems}
      isDark={isDark}
      onToggleTheme={() => setIsDark(!isDark)}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      <PageContainer variant="wide" className="py-6">
        <ProtectedRoute path={basePath} onNavigateHome={() => handleNavigate('/dashboard')}>
          {basePath === '/dashboard' ? (
            /* REAL DASHBOARD (PROMPT 05) */
            <DashboardPage onNavigate={handleNavigate} />
          ) : basePath === '/contacts' ? (
            /* REAL CONTACTS LIST (PROMPT 06) */
            <ContactsPage onNavigate={handleNavigate} />
          ) : basePath === '/contacts/create' ? (
            /* REAL CONTACT CREATE (PROMPT 07) */
            <ContactCreatePage onNavigate={handleNavigate} />
          ) : basePath === '/contacts/import' ? (
            /* REAL CONTACT IMPORT WIZARD (PROMPT 08) */
            <ContactImportWizard onNavigate={handleNavigate} />
          ) : basePath.startsWith('/contacts/') && basePath.endsWith('/edit') ? (
            /* REAL CONTACT EDIT (PROMPT 07) */
            <ContactEditPage
              contactId={basePath.replace('/contacts/', '').replace('/edit', '')}
              onNavigate={handleNavigate}
            />
          ) : basePath.startsWith('/contacts/') ? (
            /* REAL CONTACT DETAIL (PROMPT 07) */
            <ContactDetailPage
              contactId={basePath.replace('/contacts/', '')}
              onNavigate={handleNavigate}
            />
          ) : basePath === '/lists' ? (
            /* REAL LISTS PAGE (PROMPT 09) */
            <ListsPage onNavigate={handleNavigate} />
          ) : basePath === '/lists/create' ? (
            /* REAL LIST CREATE (PROMPT 09) */
            <ListCreatePage onNavigate={handleNavigate} />
          ) : basePath.startsWith('/lists/') && basePath.endsWith('/edit') ? (
            <ListCreatePage
              listId={basePath.replace('/lists/', '').replace('/edit', '')}
              onNavigate={handleNavigate}
            />
          ) : basePath.startsWith('/lists/') ? (
            /* REAL LIST DETAIL (PROMPT 09) */
            <ListDetailPage
              listId={basePath.replace('/lists/', '')}
              onNavigate={handleNavigate}
            />
          ) : basePath === '/segments' ? (
            /* REAL SEGMENTS LIST (PROMPT 10) */
            <SegmentsPage onNavigate={handleNavigate} />
          ) : basePath === '/segments/create' ? (
            /* REAL SEGMENT CREATE (PROMPT 10) */
            <SegmentBuilderPage onNavigate={handleNavigate} />
          ) : basePath.startsWith('/segments/') && basePath.endsWith('/edit') ? (
            /* REAL SEGMENT EDIT (PROMPT 10) */
            <SegmentBuilderPage
              segmentId={basePath.replace('/segments/', '').replace('/edit', '')}
              isEdit
              onNavigate={handleNavigate}
            />
          ) : basePath.startsWith('/segments/') ? (
            /* REAL SEGMENT DETAIL (PROMPT 10) */
            <SegmentDetailPage
              segmentId={basePath.replace('/segments/', '')}
              onNavigate={handleNavigate}
            />
          ) : basePath === '/templates' ? (
            /* REAL TEMPLATES LIBRARY (PROMPT 11) */
            <TemplatesPage onNavigate={handleNavigate} />
          ) : basePath === '/templates/create' ? (
            /* REAL TEMPLATE CREATE (PROMPT 12) */
            <TemplateEditorPage onNavigate={handleNavigate} />
          ) : basePath.startsWith('/templates/') && basePath.endsWith('/edit') ? (
            /* REAL TEMPLATE EDIT (PROMPT 12) */
            <TemplateEditorPage
              templateId={basePath.replace('/templates/', '').replace('/edit', '')}
              isEdit
              onNavigate={handleNavigate}
            />
          ) : basePath === '/campaigns' ? (
            /* REAL CAMPAIGNS LIST (PROMPT 13) */
            <CampaignsPage onNavigate={handleNavigate} />
          ) : basePath === '/campaigns/create' ? (
            /* REAL CAMPAIGN WIZARD (PROMPT 14) */
            <CampaignWizardPage onNavigate={handleNavigate} />
          ) : basePath.startsWith('/campaigns/') && basePath.endsWith('/report') ? (
            /* REAL CAMPAIGN REPORT (PROMPT 24) */
            <CampaignReportPage
              campaignId={basePath.replace('/campaigns/', '').replace('/report', '')}
              onNavigate={handleNavigate}
            />
          ) : basePath.startsWith('/campaigns/') && basePath !== '/campaigns/create' ? (
            /* REAL CAMPAIGN DETAIL (PROMPT 21) */
            <CampaignDetailPage
              campaignId={basePath.replace('/campaigns/', '')}
              onNavigate={handleNavigate}
            />
          ) : basePath === '/analytics' || basePath === '/reports' ? (
            /* REAL ANALYTICS DASHBOARD (PROMPT 23) */
            <AnalyticsPage onNavigate={handleNavigate} />
          ) : basePath === '/settings/members' || basePath === '/members' ? (
            /* REAL MEMBERS & ROLES (PROMPT 25) */
            <MembersPage onNavigate={handleNavigate} />
          ) : basePath === '/settings/senders' || basePath === '/senders' ? (
            /* REAL SENDERS MANAGEMENT (PROMPT 26) */
            <SendersPage onNavigate={handleNavigate} />
          ) : basePath === '/settings/domains' || basePath === '/domains' ? (
            /* REAL DOMAINS & DNS MANAGEMENT (PROMPT 27) */
            <DomainsPage onNavigate={handleNavigate} />
          ) : basePath.startsWith('/settings/billing') || basePath === '/billing' ? (
            /* REAL BILLING & USAGE (PROMPT 28) */
            <BillingPage
              subSection={
                basePath.endsWith('/usage')
                  ? 'usage'
                  : basePath.endsWith('/invoices')
                  ? 'invoices'
                  : 'overview'
              }
              onNavigate={handleNavigate}
            />
          ) : basePath === '/settings/workspace' || basePath === '/workspace' ? (
            /* REAL WORKSPACE SETTINGS (PROMPT 29) */
            <WorkspaceSettingsPage onNavigate={handleNavigate} />
          ) : basePath === '/notifications' ? (
            /* REAL NOTIFICATION CENTER (PROMPT 30) */
            <NotificationsPage onNavigate={handleNavigate} />
          ) : basePath === '/settings/profile' || basePath === '/profile' ? (
            /* REAL PROFILE & SECURITY (PROMPT 31) */
            <ProfilePage onNavigate={handleNavigate} />
          ) : (
            /* Other views placeholder */
            <div className="space-y-6">
              <PageHeader
                title={currentRoute.title}
                description={currentRoute.description}
                badge={
                  <div className="flex items-center gap-1.5">
                    {currentRoute.badgeText && (
                      <Badge variant="default" className="text-xs">
                        {currentRoute.badgeText}
                      </Badge>
                    )}
                    <Badge variant={roleMetadata.badgeVariant} className="text-xs">
                      {roleMetadata.name}
                    </Badge>
                  </div>
                }
                actions={
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      onClick={() =>
                        showToast({
                          type: 'info',
                          title: 'Làm mới dữ liệu',
                          description: 'Đã cập nhật trạng thái mới nhất từ server.',
                        })
                      }
                    >
                      Làm Mới
                    </Button>

                    <PermissionGate
                      permission={PERMISSIONS.CONTACT_EXPORT}
                      renderDisabled
                      disabledTooltip="Cần quyền CONTACT_EXPORT để tải dữ liệu"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          showToast({
                            type: 'success',
                            title: 'Xuất CSV',
                            description: 'Đang tải file danh bạ về máy.',
                          })
                        }
                      >
                        Xuất Dữ Liệu
                      </Button>
                    </PermissionGate>

                    <PermissionGate
                      permission={PERMISSIONS.CAMPAIGN_CREATE}
                      renderDisabled
                      disabledTooltip="Bạn không có quyền tạo chiến dịch (CAMPAIGN_CREATE)"
                    >
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() =>
                          showToast({
                            type: 'success',
                            title: 'Thao tác mới',
                            description: `Khởi tạo bản ghi mới trong ${currentRoute.title}`,
                          })
                        }
                      >
                        Thêm Mới
                      </Button>
                    </PermissionGate>
                  </div>
                }
              />

              {currentRoute.stats && currentRoute.stats.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentRoute.stats.map((stat, idx) => (
                    <MetricCard
                      key={idx}
                      label={stat.label}
                      value={stat.value}
                      change={stat.trend}
                      trend={stat.trend?.includes('+') ? 'up' : 'neutral'}
                    />
                  ))}
                </div>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {currentRoute.icon}
                    <CardTitle className="text-base">{currentRoute.title}</CardTitle>
                  </div>
                  <CardDescription>{currentRoute.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                    <div className="text-slate-400 dark:text-slate-500 font-medium text-sm">
                      Khu vực nội dung giao diện cho đường dẫn <code className="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">{currentPath}</code>
                    </div>
                    <div className="text-xs text-slate-400">
                      Đang vận hành trên hệ thống phân quyền của vai trò: <strong>{roleMetadata.name} ({roleMetadata.titleVn})</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ProtectedRoute>
      </PageContainer>
    </AppShell>
  )
}

export function App() {
  return (
    <ToastProvider>
      <NotificationProvider>
        <PermissionProvider>
          <AuthProvider>
            <WorkspaceProvider>
              <AppContent />
            </WorkspaceProvider>
          </AuthProvider>
        </PermissionProvider>
      </NotificationProvider>
    </ToastProvider>
  )
}

export default App
