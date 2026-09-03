export type ContactStatus = 'active' | 'unsubscribed' | 'bounced' | 'invalid' | 'blocked'

export interface ContactCustomField {
  key: string
  value: string
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  company?: string
  phone?: string
  lists: string[]
  listIds?: string[]
  tags: string[]
  status: ContactStatus
  customFields?: ContactCustomField[]
  createdAt: string
  updatedAt: string
  avatarColor?: string
}

export interface ContactFilterState {
  searchQuery: string
  selectedList: string
  selectedTag: string
  selectedStatus: string
  selectedSegment: string
  createdDateRange?: string
}
