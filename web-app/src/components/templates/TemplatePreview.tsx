import React from 'react'

export interface TemplatePreviewProps {
  subject: string
  previewText?: string
  htmlContent: string
  device: 'desktop' | 'mobile'
  thumbnailGradient?: string
  bannerLabel?: string
  bannerTitle?: string
  fromName?: string
  fromEmail?: string
  toDisplay?: string
  sampleRecipient?: {
    firstName: string
    lastName: string
    email: string
    company: string
    phone: string
  }
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  subject,
  previewText,
  htmlContent,
  device,
  thumbnailGradient,
  bannerLabel,
  bannerTitle,
  fromName = 'MailFlow Sender',
  fromEmail = 'newsletter@mailflow.vn',
  toDisplay,
  sampleRecipient = {
    firstName: 'A',
    lastName: 'B',
    email: 'a.b@gmail.com',
    company: 'Company',
    phone: '+84 912 345 678',
  },
}) => {
  // Replace template variables with sample recipient mock data
  const renderResolvedHtml = (raw: string) => {
    return raw
      .replace(/\{\{firstName\}\}/g, `<strong>${sampleRecipient.firstName}</strong>`)
      .replace(/\{\{lastName\}\}/g, `<strong>${sampleRecipient.lastName}</strong>`)
      .replace(/\{\{email\}\}/g, `<span class="text-blue-600">${sampleRecipient.email}</span>`)
      .replace(/\{\{company\}\}/g, `<strong>${sampleRecipient.company}</strong>`)
      .replace(/\{\{phone\}\}/g, `<span>${sampleRecipient.phone}</span>`)
      .replace(
        /\{\{unsubscribeUrl\}\}/g,
        `<span class="underline text-blue-500 cursor-pointer">hủy đăng ký tại đây (RFC 8058)</span>`
      )
  }

  const renderResolvedText = (raw: string) => {
    return raw
      .replace(/\{\{firstName\}\}/g, sampleRecipient.firstName)
      .replace(/\{\{lastName\}\}/g, sampleRecipient.lastName)
      .replace(/\{\{email\}\}/g, sampleRecipient.email)
      .replace(/\{\{company\}\}/g, sampleRecipient.company)
      .replace(/\{\{phone\}\}/g, sampleRecipient.phone)
      .replace(/\{\{unsubscribeUrl\}\}/g, 'hủy đăng ký tại đây')
  }

  return (
    <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-center min-h-[580px] overflow-y-auto">
      <div
        className={`transition-all duration-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden ${
          device === 'mobile' ? 'w-[360px] min-h-[540px]' : 'w-full max-w-xl min-h-[480px]'
        }`}
      >
        {/* Email Client Simulated Top Header */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 space-y-1 text-xs select-none">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-slate-700 dark:text-slate-300">{fromName}</span>
              <span>&lt;{fromEmail}&gt;</span>
            </div>
            <span className="shrink-0 font-mono">10:00 AM</span>
          </div>

          {toDisplay ? (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>Gửi tới:</span>
              <strong className="text-slate-800 dark:text-slate-200 truncate">{toDisplay}</strong>
            </div>
          ) : null}

          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
            {renderResolvedText(subject || '(Chưa nhập tiêu đề email)')}
          </div>

          {previewText && (
            <div className="text-[11px] text-slate-500 truncate">{previewText}</div>
          )}
        </div>

        {/* Email Rendered Canvas Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Top Brand Banner — matches EmailTemplateLayout / template editor */}
          <div
            className={`p-5 rounded-xl text-white text-center space-y-1 ${
              thumbnailGradient || 'bg-gradient-to-tr from-blue-600 to-indigo-600'
            }`}
          >
            {bannerLabel?.trim() ? (
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                {bannerLabel}
              </div>
            ) : null}
            <h3 className="text-lg font-extrabold tracking-tight">
              {bannerTitle?.trim() || 'Bản Tin MailFlow'}
            </h3>
          </div>

          {/* HTML / Rich Text Rendered Content */}
          <div
            className="text-xs sm:text-sm leading-relaxed space-y-3 prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: htmlContent
                ? renderResolvedHtml(htmlContent)
                : '<p class="text-slate-400 italic">Nhập nội dung mẫu email bên trái để xem kết quả hiển thị trực tiếp...</p>',
            }}
          />

          {/* RFC 8058 footer — same as template editor preview */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 text-center space-y-1 text-[10px] text-slate-400">
            <p>© 2026 MailFlow Inc. Tất cả quyền được bảo lưu.</p>
            <p>
              Bạn nhận được email này theo yêu cầu nhận tin.{' '}
              <span className="underline text-blue-600 cursor-pointer">Hủy đăng ký</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplatePreview
