import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ContactForm } from '../components/contacts/ContactForm'
import type { ContactFormData } from '../schemas/contact.schemas'
import { useToast } from '../components/ui/Toast'
import { ApiError } from '../services/apiClient'
import { contactService } from '../services/contact.service'

export interface ContactCreatePageProps {
  onNavigate: (path: string) => void
}

export const ContactCreatePage: React.FC<ContactCreatePageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()

  const handleSubmit = async (data: ContactFormData, shouldAddAnother?: boolean) => {
    try {
      await contactService.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        status: data.status,
        tags: data.tags,
        customFields: data.customFields,
      })

      showToast({
        type: 'success',
        title: 'Đã tạo liên hệ thành công',
        description: `Đã thêm liên hệ "${data.lastName} ${data.firstName}" (${data.email}) vào danh bạ.`,
      })

      if (shouldAddAnother) {
        return
      }
      onNavigate('/contacts')
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không tạo được liên hệ',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thêm Liên Hệ Mới"
        description="Điền thông tin chi tiết để nạp khách hàng vào hệ thống danh bạ và phân bổ chiến dịch email."
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => onNavigate('/contacts')}
          >
            Quay Lại Danh Bạ
          </Button>
        }
      />

      <ContactForm
        isEdit={false}
        onSubmit={handleSubmit}
        onCancel={() => onNavigate('/contacts')}
      />
    </div>
  )
}

export default ContactCreatePage
