import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ContactForm } from '../components/contacts/ContactForm'
import type { ContactFormData } from '../schemas/contact.schemas'
import type { Contact } from '../types/contact.types'
import { useToast } from '../components/ui/Toast'

export interface ContactEditPageProps {
  contactId: string
  onNavigate: (path: string) => void
}

export const ContactEditPage: React.FC<ContactEditPageProps> = ({
  contactId,
  onNavigate,
}) => {
  const { showToast } = useToast()

  // Sample initial data based on id
  const sampleContact: Contact = {
    id: contactId || 'cnt-1',
    firstName: 'Thành',
    lastName: 'Nguyễn Văn',
    fullName: 'Nguyễn Văn Thành',
    email: 'thanh.nguyen@vcorp.vn',
    company: 'V-Corp Global',
    phone: '+84 912 345 678',
    lists: ['VIP Enterprise', 'Newsletter Subscribers'],
    tags: ['Customer', 'High Value', 'Decision Maker'],
    status: 'active',
    createdAt: '15/08/2026',
    updatedAt: '24/08/2026',
  }

  const handleSubmit = async (data: ContactFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 800))

    showToast({
      type: 'success',
      title: 'Đã cập nhật liên hệ',
      description: `Thông tin của ${data.lastName} ${data.firstName} đã được lưu thành công.`,
    })

    onNavigate(`/contacts/${contactId || 'cnt-1'}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`Chỉnh Sửa Liên Hệ: ${sampleContact.fullName}`}
        description={`Cập nhật thông tin email, số điện thoại, danh sách và nhãn phân khúc.`}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => onNavigate(`/contacts/${contactId || 'cnt-1'}`)}
          >
            Quay Lại Chi Tiết
          </Button>
        }
      />

      {/* Reusable Form */}
      <ContactForm
        initialData={sampleContact}
        isEdit={true}
        onSubmit={handleSubmit}
        onCancel={() => onNavigate(`/contacts/${contactId || 'cnt-1'}`)}
      />
    </div>
  )
}

export default ContactEditPage
