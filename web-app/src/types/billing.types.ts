export type PlanTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM'

export type InvoiceStatus = 'PAID' | 'PENDING' | 'FAILED'

export interface InvoiceItem {
  id: string
  invoiceNumber: string
  date: string
  amount: string
  numericAmount: number
  status: InvoiceStatus
  pdfUrl?: string
  taxInvoiceUrl?: string
  description: string
}

export interface UsageQuota {
  current: number
  limit: number
  unit: string
  resetDate: string
}

export interface PaymentMethod {
  id: string
  brand: 'VISA' | 'MASTERCARD' | 'JCB' | 'MOMO' | 'BANK_TRANSFER'
  last4: string
  expiry: string
  holderName: string
  isDefault: boolean
}

export interface BillingDetails {
  planTier: PlanTier
  planName: string
  billingCycle: 'monthly' | 'yearly'
  monthlyCost: string
  renewalDate: string
  emailsUsage: UsageQuota
  contactsUsage: UsageQuota
  dedicatedIpsCount: number
  paymentMethod: PaymentMethod
  companyTaxName: string
  companyTaxCode: string
  companyAddress: string
}
