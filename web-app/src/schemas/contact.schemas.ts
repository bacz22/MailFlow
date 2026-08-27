import { z } from 'zod'

export const contactFormSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Vui lòng nhập tên.')
    .max(50, 'Tên không vượt quá 50 ký tự.'),
  lastName: z
    .string()
    .min(1, 'Vui lòng nhập họ và tên đệm.')
    .max(50, 'Họ không vượt quá 50 ký tự.'),
  email: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ email.')
    .email('Định dạng email không hợp lệ (ví dụ: name@company.com).'),
  phone: z.string().optional(),
  company: z.string().optional(),
  lists: z.array(z.string()),
  tags: z.array(z.string()),
  status: z.enum(['active', 'unsubscribed', 'bounced', 'invalid', 'blocked']),
  customFields: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ),
})

export type ContactFormData = z.infer<typeof contactFormSchema>
