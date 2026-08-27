import React, { useState } from 'react'
import {
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  HelpCircle,
  Info,
  RefreshCw,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { FormField, FormLabel } from '../ui/FormGroup'
import { Badge } from '../ui/Badge'
import type { DomainItem, DnsRecord } from '../../types/domain.types'

export interface AddDomainWizardDialogProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (domain: DomainItem) => void
}

export const AddDomainWizardDialog: React.FC<AddDomainWizardDialogProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [domainInput, setDomainInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationDone, setVerificationDone] = useState(false)

  // Step 1: Validate Domain
  const handleNextStep2 = () => {
    const cleanDomain = domainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!cleanDomain || !cleanDomain.includes('.')) {
      setError('Vui lòng nhập tên miền hợp lệ (ví dụ: congty.vn hoặc mail.congty.com).')
      return
    }
    setDomainInput(cleanDomain)
    setError(null)
    setStep(2)
  }

  // Generated records based on domain
  const generatedRecords: DnsRecord[] = [
    {
      id: 'rec-spf',
      type: 'TXT',
      name: 'SPF Authentication',
      host: '@',
      value: 'v=spf1 include:mailflow.vn ~all',
      status: 'VERIFIED',
      purpose: 'SPF',
      description: 'Cho phép máy chủ MailFlow gửi thư đại diện cho tên miền của bạn',
    },
    {
      id: 'rec-dkim',
      type: 'TXT',
      name: 'DKIM Signature',
      host: 'mailflow._domainkey',
      value: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3...${domainInput.slice(0, 4)}...DAQAB`,
      status: 'VERIFIED',
      purpose: 'DKIM',
      description: 'Chữ ký điện tử mã hóa chống giả mạo email',
    },
    {
      id: 'rec-dmarc',
      type: 'TXT',
      name: 'DMARC Policy',
      host: '_dmarc',
      value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@mailflow.vn',
      status: 'VERIFIED',
      purpose: 'DMARC',
      description: 'Chính sách bảo vệ hộp thư và báo cáo spam',
    },
  ]

  // Step 3: Trigger Verification
  const handleVerifyStep3 = async () => {
    setIsVerifying(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsVerifying(false)
    setVerificationDone(true)
  }

  const handleFinish = () => {
    const newDomainItem: DomainItem = {
      id: `dom-${Date.now()}`,
      domain: domainInput,
      status: 'VERIFIED',
      createdAt: new Date().toLocaleDateString('vi-VN'),
      lastVerifiedAt: 'Vừa xong',
      records: generatedRecords,
      sendersCount: 0,
    }
    onComplete(newDomainItem)
    // Reset
    setStep(1)
    setDomainInput('')
    setVerificationDone(false)
    onClose()
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <Globe className="w-5 h-5" />
            <DialogTitle>Thêm & Xác Thực Tên Miền Từng Bước (DNS Setup)</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Quy trình 3 bước đơn giản giúp cấu hình bản ghi xác thực SPF/DKIM để email luôn vào Inbox.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper Progress Indicator */}
        <div className="flex items-center justify-between gap-2 px-2 py-3 border-b border-slate-100 dark:border-slate-800 text-xs">
          {[
            { num: 1, label: '1. Nhập Tên Miền' },
            { num: 2, label: '2. Thêm Bản Ghi DNS' },
            { num: 3, label: '3. Kiểm Tra & Hoàn Tất' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 font-bold transition ${
                step === s.num
                  ? 'text-blue-600'
                  : step > s.num
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === s.num
                    ? 'bg-blue-600 text-white shadow-xs'
                    : step > s.num
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <div className="space-y-4 py-3 text-xs">
            <FormField>
              <FormLabel required>Tên Miền Của Doanh Nghiệp (Domain Name)</FormLabel>
              <Input
                placeholder="Ví dụ: mycompany.vn hoặc mail.mycompany.com"
                leftIcon={<Globe className="w-4 h-4 text-slate-400" />}
                value={domainInput}
                onChange={(e) => {
                  setDomainInput(e.target.value)
                  if (error) setError(null)
                }}
                hasError={!!error}
                autoFocus
              />
              {error && <span className="text-[11px] text-rose-500 font-medium">{error}</span>}
            </FormField>

            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-1.5 text-blue-900 dark:text-blue-200">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Tại Sao Cần Xác Thực Tên Miền?</span>
              </div>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300 leading-relaxed pl-5">
                Xác thực tên miền giúp các nhà cung cấp hòm thư như Gmail, Outlook và Yahoo xác nhận bạn là chủ sở hữu hợp pháp, ngăn chặn thư bị phân loại vào Spam hoặc hòm rác.
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[11px]">Tên miền đang cấu hình:</span>
                <div className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">
                  {domainInput}
                </div>
              </div>
              <span className="text-[11px] text-blue-600 font-semibold">
                Sao chép 3 bản ghi dưới đây vào trang DNS:
              </span>
            </div>

            <div className="space-y-3">
              {generatedRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="font-mono text-[10px]">
                        {rec.type}
                      </Badge>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {rec.name} ({rec.purpose})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{rec.description}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between font-mono">
                      <span className="truncate">Host: <strong>{rec.host}</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopy(rec.host, `host-${rec.id}`)}
                        className="text-slate-400 hover:text-blue-600 transition cursor-pointer p-0.5"
                      >
                        {copiedKey === `host-${rec.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between font-mono">
                      <span className="truncate" title={rec.value}>
                        Value: <strong>{rec.value.slice(0, 20)}...</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(rec.value, `val-${rec.id}`)}
                        className="text-slate-400 hover:text-blue-600 transition cursor-pointer p-0.5"
                      >
                        {copiedKey === `val-${rec.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>Thời gian lan truyền DNS thông thường từ 5 phút đến tối đa 24 giờ.</span>
            </div>
          </div>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 3 && (
          <div className="space-y-4 py-4 text-xs text-center">
            {!verificationDone ? (
              <div className="py-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center">
                  <RefreshCw className={`w-6 h-6 ${isVerifying ? 'animate-spin' : ''}`} />
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Kiểm Tra Tình Trạng Bản Ghi DNS
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hệ thống sẽ gửi truy vấn DNS đến tên miền <strong>{domainInput}</strong> để đối soát bản ghi SPF, DKIM và DMARC.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isVerifying}
                  onClick={handleVerifyStep3}
                >
                  Bắt Đầu Kiểm Tra Ngay
                </Button>
              </div>
            ) : (
              <div className="py-6 space-y-3 animate-in fade-in-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="font-bold text-emerald-900 dark:text-emerald-200 text-base">
                  Xác Thực Tên Miền Thành Công!
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tất cả các bản ghi SPF, DKIM và DMARC của tên miền <strong>{domainInput}</strong> đã được đồng bộ chuẩn xác. Bạn có thể gán địa chỉ người gửi ngay bây giờ.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && !verificationDone && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => setStep((step - 1) as any)}
            >
              Quay Lại
            </Button>
          )}

          {step === 1 && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={handleNextStep2}
            >
              Tiếp Tục
            </Button>
          )}

          {step === 2 && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => setStep(3)}
            >
              Đã Thêm DNS, Tiến Hành Xác Minh
            </Button>
          )}

          {step === 3 && verificationDone && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 font-bold"
              onClick={handleFinish}
            >
              Hoàn Tất & Đóng
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddDomainWizardDialog
