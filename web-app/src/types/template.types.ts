export type TemplateStatus = 'published' | 'draft' | 'archived'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  previewText?: string
  category: 'Newsletter' | 'Product' | 'Onboarding' | 'Promotional' | 'Transactional'
  status: TemplateStatus
  createdBy: string
  createdAvatar?: string
  createdAt: string
  updatedAt: string
  htmlContent: string
  thumbnailGradient?: string
}
