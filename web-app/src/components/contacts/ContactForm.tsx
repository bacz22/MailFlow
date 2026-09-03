import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User,
  Mail,
  Phone,
  Building2,
  ListPlus,
  Tag,
  Plus,
  Trash2,
  Save,
  UserPlus,
  X,
} from 'lucide-react'
import { contactFormSchema } from '../../schemas/contact.schemas'
import type { ContactFormData } from '../../schemas/contact.schemas'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { FormField, FormLabel, FormMessage } from '../ui/FormGroup'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import type { Contact } from '../../types/contact.types'

export interface ContactFormProps {
  initialData?: Partial<Contact>
  isEdit?: boolean
  onSubmit: (data: ContactFormData, shouldAddAnother?: boolean) => Promise<void> | void
  onCancel: () => void
  className?: string
}

const POPULAR_TAGS = ['Customer', 'Lead', 'High Value', 'Decision Maker', 'Engaged', 'Trial']

export const ContactForm: React.FC<ContactFormProps> = ({
  initialData,
  isEdit = false,
  onSubmit,
  onCancel,
  className,
}) => {
  const [newTagInput, setNewTagInput] = useState('')

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      company: initialData?.company || '',
      status: initialData?.status || 'active',
      lists: initialData?.lists || [],
      tags: initialData?.tags || (isEdit ? [] : ['Lead']),
      customFields: initialData?.customFields?.length
        ? initialData.customFields
        : [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customFields',
  })

  const selectedTags = watch('tags') || []

  const addTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim()
    if (!trimmed) return
    if (!selectedTags.includes(trimmed)) {
      setValue('tags', [...selectedTags, trimmed], { shouldValidate: true })
    }
    setNewTagInput('')
  }

  const removeTag = (tagToRemove: string) => {
    setValue(
      'tags',
      selectedTags.filter((t) => t !== tagToRemove),
      { shouldValidate: true }
    )
  }

  const onValidSubmit = async (data: ContactFormData) => {
    await onSubmit(data, false)
  }

  const onValidSubmitAndAddAnother = async (data: ContactFormData) => {
    await onSubmit(data, true)
    reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      status: 'active',
      lists: ['Newsletter Subscribers'],
      tags: ['Lead'],
      customFields: [],
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onValidSubmit)}
      className={`space-y-6 max-w-4xl mx-auto ${className || ''}`}
      noValidate
    >
      {/* SECTION 1: BASIC INFORMATION */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-base">Thông Tin Cơ Bản (Basic Information)</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Họ tên, địa chỉ email nhận tin và thông tin doanh nghiệp của liên hệ.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Row 1: Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField>
              <FormLabel required>Họ & Tên đệm</FormLabel>
              <Input
                placeholder="Nguyễn Văn"
                hasError={!!errors.lastName}
                {...register('lastName')}
              />
              {errors.lastName && <FormMessage error={errors.lastName.message} />}
            </FormField>

            <FormField>
              <FormLabel required>Tên</FormLabel>
              <Input
                placeholder="Thành"
                hasError={!!errors.firstName}
                {...register('firstName')}
              />
              {errors.firstName && <FormMessage error={errors.firstName.message} />}
            </FormField>
          </div>

          {/* Row 2: Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField>
              <FormLabel required>Địa chỉ Email</FormLabel>
              <Input
                type="email"
                placeholder="thanh.nguyen@company.com"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                hasError={!!errors.email}
                {...register('email')}
              />
              {errors.email && <FormMessage error={errors.email.message} />}
            </FormField>

            <FormField>
              <FormLabel>Số Điện Thoại</FormLabel>
              <Input
                placeholder="+84 912 345 678"
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                {...register('phone')}
              />
            </FormField>
          </div>

          {/* Row 3: Company & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField>
              <FormLabel>Công Ty / Tổ Chức</FormLabel>
              <Input
                placeholder="Tập đoàn V-Corp"
                leftIcon={<Building2 className="w-4 h-4 text-slate-400" />}
                {...register('company')}
              />
            </FormField>

            <FormField>
              <FormLabel required>Trạng Thái Gửi Thư</FormLabel>
              <select
                {...register('status')}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus-ring cursor-pointer"
              >
                <option value="active">Hoạt động (Active - Sẵn sàng nhận email)</option>
                <option value="unsubscribed">Đã hủy đăng ký (Unsubscribed)</option>
                <option value="bounced">Bounced (Hộp thư bị lỗi trả về)</option>
                <option value="invalid">Không hợp lệ (Invalid)</option>
                <option value="blocked">Đã chặn / Báo cáo spam (Blocked)</option>
              </select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: AUDIENCE (LISTS & TAGS) */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ListPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base">Phân Bổ Danh Sách & Gán Thẻ (Audience)</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Thêm liên hệ vào danh sách gửi và gắn nhãn phân khúc hành vi.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          {/* Lists Selection */}
          <div className="space-y-2">
            <FormLabel>Danh Sách Gửi (Contact Lists)</FormLabel>
            <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 text-xs text-slate-500">
              Danh sách tĩnh sẽ có ở phase Lists. Hiện tại bạn có thể gán thẻ tag cho liên hệ.
            </div>
          </div>

          {/* Tags Selection & Input */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <FormLabel>Thẻ Phân Khúc (Tags)</FormLabel>

            {/* Active Tags */}
            <div className="flex flex-wrap gap-2 min-h-[32px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 items-center">
              {selectedTags.length === 0 && (
                <span className="text-xs text-slate-400">Chưa có thẻ nào được gán</span>
              )}
              {selectedTags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold"
                >
                  <Tag className="w-3 h-3" />
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Quick add tag suggestions & input */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 max-w-xs">
                <Input
                  placeholder="Nhập tên thẻ mới..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(newTagInput)
                    }
                  }}
                  rightIcon={
                    newTagInput ? (
                      <button
                        type="button"
                        onClick={() => addTag(newTagInput)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Thêm
                      </button>
                    ) : undefined
                  }
                />
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                <span>Gợi ý:</span>
                {POPULAR_TAGS.filter((t) => !selectedTags.includes(t))
                  .slice(0, 3)
                  .map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addTag(t)}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      +{t}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: CUSTOM FIELDS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <CardTitle className="text-base">Thuộc Tính Tùy Chỉnh (Custom Fields)</CardTitle>
            <CardDescription className="text-xs">
              Các trường thông tin mở rộng dùng để cá nhân hóa nội dung email (Merge Tags).
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ key: '', value: '' })}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Thêm Trường
          </Button>
        </CardHeader>

        <CardContent className="space-y-3 pt-4">
          {fields.length === 0 ? (
            <div className="p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
              Chưa có trường tùy chỉnh nào. Nhấn "Thêm Trường" để nạp các thuộc tính đặc thù.
            </div>
          ) : (
            fields.map((field, idx) => (
              <div key={field.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Tên thuộc tính (ví dụ: Chức danh)"
                    {...register(`customFields.${idx}.key`)}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="Giá trị (ví dụ: Giám Đốc Kinh Doanh)"
                    {...register(`customFields.${idx}.value`)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="Xóa trường này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* STICKY FORM ACTION BUTTONS */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy Bỏ
        </Button>

        <div className="flex items-center gap-3">
          {!isEdit && (
            <Button
              type="button"
              variant="secondary"
              isLoading={isSubmitting}
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={handleSubmit(onValidSubmitAndAddAnother)}
            >
              Lưu & Thêm Tiếp
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEdit ? 'Cập Nhật Liên Hệ' : 'Lưu Liên Hệ'}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default ContactForm
