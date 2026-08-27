export type ContactStatus = 'active' | 'unsubscribed' | 'bounced' | 'invalid' | 'blocked'

export interface Contact {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  company?: string
  phone?: string
  lists: string[]
  tags: string[]
  status: ContactStatus
  createdAt: string
  updatedAt: string
  avatarColor?: string
}

export interface ContactFilterState {
  searchQuery: string
  selectedList: string
  selectedTag: string
  selectedStatus: string
  createdDateRange?: string
}
