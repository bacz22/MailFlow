export type CampaignWizardStep = 1 | 2 | 3 | 4 | 5 | 6

export interface CampaignStep1Info {
  campaignName: string
  subject: string
  previewText: string
  senderId: string
  senderName: string
  senderEmail: string
  replyTo: string
}

export interface CampaignStep2Audience {
  selectedListIds: string[]
  selectedSegmentIds: string[]
  excludedListIds: string[]
  estimatedRecipients: number
}

export interface CampaignStep3Content {
  templateId?: string
  templateName?: string
  htmlContent: string
  thumbnailGradient?: string
  bannerLabel?: string
  bannerTitle?: string
}

export interface CampaignStep4PreviewTest {
  testEmail: string
  isTestSent: boolean
}

export interface CampaignStep5Schedule {
  sendType: 'immediate' | 'scheduled'
  scheduledDate?: string
  scheduledTime?: string
  /** Demo cố định Asia/Bangkok (GMT+7); UI timezone đã ẩn */
  timezone?: string
}

export interface CampaignWizardState {
  step1: CampaignStep1Info
  step2: CampaignStep2Audience
  step3: CampaignStep3Content
  step4: CampaignStep4PreviewTest
  step5: CampaignStep5Schedule
}
