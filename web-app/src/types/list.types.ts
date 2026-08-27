export interface AudienceList {
  id: string
  name: string
  description: string
  contactCount: number
  activeCount: number
  unsubscribedCount: number
  createdAt: string
  updatedAt: string
  tags?: string[]
}

export interface AudienceTag {
  id: string
  name: string
  color: string // Tailwind classes for text and bg/border with high contrast accessibility
  contactCount: number
  createdAt: string
}
