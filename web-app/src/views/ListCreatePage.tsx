import React, { useState } from 'react'
import { ArrowLeft, Layers, Save, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { FormField, FormLabel } from '../components/ui/FormGroup'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'

export interface ListCreatePageProps {
  onNavigate: (path: string) => void
}

export const ListCreatePage: React.FC<ListCreatePageProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast({
        type: 'warning',
        title: 'Chưa nhập tên danh sách',
        description: 'Vui lòng cung cấp tên gợi nhớ cho danh sách người nhận.',
      })
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setIsSubmitting(false)

    showToast({
      type: 'success',
      title: 'Tạo danh sách thành công',
      description: `Đã tạo danh sách "${name}". Bạn có thể thêm hoặc import liên hệ ngay bây giờ.`,
    })

    onNavigate('/lists')
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Tạo Danh Sách Người Nhận Mới"
        description="Khởi tạo một danh sách riêng biệt để gom nhóm khách hàng theo chiến dịch, sự kiện hoặc nguồn opt-in."
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => onNavigate('/lists')}
          >
            Quay Lại Danh Sách
          </Button>
        }
      />

      {/* Form Card */}
      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base">Thông Tin Danh Sách</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Các thông tin này dùng cho nội bộ quản trị và không hiển thị cho người nhận email.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {/* List Name */}
            <FormField>
              <FormLabel required>Tên Danh Sách (List Name)</FormLabel>
              <Input
                placeholder="Ví dụ: Khách Hàng VIP Enterprise Q3..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </FormField>

            {/* List Description */}
            <FormField>
              <FormLabel>Mô Tả Mục Đích (Description)</FormLabel>
              <textarea
                rows={3}
                placeholder="Mô tả nguồn gốc thu thập hoặc nhóm đối tượng áp dụng cho danh sách này..."
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-sans text-slate-800 dark:text-slate-200 focus-ring placeholder:text-slate-400"
              />
            </FormField>

            {/* Default Opt-in Badge note */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3 text-xs">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-blue-900 dark:text-blue-200">
                <div className="font-bold">Cơ Chế Bảo Vệ Danh Bạ</div>
                <div className="text-[11px] text-blue-700/80 dark:text-blue-300">
                  Mọi danh sách tạo mới trên MailFlow được tự động bảo vệ bởi cơ chế lọc trùng lặp và tuân thủ hủy đăng ký 1-click chuẩn RFC 8058.
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button type="button" variant="outline" onClick={() => onNavigate('/lists')}>
              Hủy Bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Tạo Danh Sách
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default ListCreatePage
