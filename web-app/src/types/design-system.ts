/**
 * MailFlow Design System & Responsive Foundation Types
 */

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

export type ContainerVariant = 'narrow' | 'default' | 'wide' | 'full'

export type DataDensity = 'comfortable' | 'compact'

export type ComponentSize = 'sm' | 'md' | 'lg'

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export type ThemeMode = 'light' | 'dark' | 'system'

export type WorkspaceRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MARKETING_MANAGER'
  | 'CAMPAIGN_EDITOR'
  | 'CONTACT_MANAGER'
  | 'ANALYST'
  | 'BILLING_MANAGER'
  | 'VIEWER'

export interface RoleConfig {
  id: WorkspaceRole
  name: string
  description: string
  badgeColor: string
  allowedRoutes: string[]
}

export interface BreakpointConfig {
  name: Breakpoint
  minWidth: number
  label: string
  targetDevice: string
  gutter: string
}
