import React, { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ContactForm } from '../components/contacts/ContactForm'
import type { ContactFormData } from '../schemas/contact.schemas'
import type { Contact } from '../types/contact.types'
import { useToast } from '../components/ui/Toast'
import { ApiError } from '../services/apiClient'
import { contactService } from '../services/contact.service'

export interface ContactEditPageProps {
  contactId: string
  onNavigate: (path: string) => void
}

export const ContactEditPage: React.FC<ContactEditPageProps> = ({
  contactId,
  onNavigate,
}) => {
  const { showToast } = useToast()
  const [contact, setContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    contactService
      .get(contactId)
      .then((data) => {
        if (!cancelled) setContact(data)
      })
      .catch((error) => {
        if (cancelled) return
        showToast({
          type: 'error',
          title: 'Không tải được liên hệ',
          description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
        })
        onNavigate('/contacts')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [contactId, onNavigate, showToast])

  const handleSubmit = async (data: ContactFormData) => {
    try {
      await contactService.update(contactId, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        status: data.status,
        tags: data.tags,
        customFields: data.customFields,
        listIds: data.lists,
      })

      showToast({
        type: 'success',
        title: 'Đã cập nhật liên hệ',
        description: `Thông tin của ${data.lastName} ${data.firstName} đã được lưu thành công.`,
      })

      onNavigate(`/contacts/${contactId}`)
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không cập nhật được liên hệ',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
      throw error
    }
  }

  if (isLoading || !contact) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chỉnh Sửa Liên Hệ" description="Đang tải thông tin liên hệ..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Chỉnh Sửa: ${contact.fullName}`}
        description={`Cập nhật thông tin liên hệ ${contact.email}.`}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => onNavigate(`/contacts/${contactId}`)}
          >
            Quay Lại Chi Tiết
          </Button>
        }
      />

      <ContactForm
        initialData={contact}
        isEdit
        onSubmit={handleSubmit}
        onCancel={() => onNavigate(`/contacts/${contactId}`)}
      />
    </div>
  )
}

export default ContactEditPage
