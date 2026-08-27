export type DomainVerificationStatus = 'VERIFIED' | 'PENDING' | 'FAILED'

export type DnsRecordType = 'TXT' | 'CNAME' | 'MX'

export interface DnsRecord {
  id: string
  type: DnsRecordType
  name: string
  host: string
  value: string
  status: 'VERIFIED' | 'PENDING' | 'FAILED'
  purpose: 'SPF' | 'DKIM' | 'DMARC' | 'MX'
  description: string
}

export interface DomainItem {
  id: string
  domain: string
  status: DomainVerificationStatus
  createdAt: string
  lastVerifiedAt: string
  records: DnsRecord[]
  sendersCount: number
}
