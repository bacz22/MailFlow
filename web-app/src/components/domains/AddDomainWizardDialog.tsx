import React, { useState } from 'react'
import {
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Info,
  RefreshCw,
  AlertTriangle,
  Clock,
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
import { useToast } from '../ui/Toast'
import { ApiError } from '../../services/apiClient'
import { domainService } from '../../services/domain.service'
import type { DomainItem } from '../../types/domain.types'

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
  const { showToast } = useToast()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [domainInput, setDomainInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [createdDomain, setCreatedDomain] = useState<DomainItem | null>(null)
  const [verificationDone, setVerificationDone] = useState(false)

  const reset = () => {
    setStep(1)
    setDomainInput('')
    setError(null)
    setCreatedDomain(null)
    setVerificationDone(false)
    setIsCreating(false)
    setIsVerifying(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleNextStep2 = async () => {
    const cleanDomain = domainInput
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
    if (!cleanDomain || !cleanDomain.includes('.')) {
      setError('Vui lòng nhập tên miền hợp lệ (ví dụ: congty.vn hoặc mail.congty.com).')
      return
    }
    setDomainInput(cleanDomain)
    setError(null)
    setIsCreating(true)
    try {
      const created = await domainService.create(cleanDomain)
      setCreatedDomain(created)
      setStep(2)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Không tạo được tên miền.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleVerifyStep3 = async () => {
    if (!createdDomain) return
    setIsVerifying(true)
    try {
      const verified = await domainService.verify(createdDomain.id)
      setCreatedDomain(verified)
      setVerificationDone(true)
      if (verified.status !== 'VERIFIED') {
        showToast({
          type: 'warning',
          title: 'DNS chưa khớp đủ',
          description: `Trạng thái hiện tại: ${verified.status}. Có thể thử lại sau khi DNS lan truyền.`,
        })
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Không kiểm tra được DNS',
        description: err instanceof ApiError ? err.detail : 'Vui lòng thử lại.',
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleFinish = () => {
    if (createdDomain) {
      onComplete(createdDomain)
    }
    reset()
    onClose()
  }

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const records = createdDomain?.records ?? []

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <Globe className="w-5 h-5" />
            <DialogTitle>Thêm & Xác Thực Tên Miền Từng Bước (DNS Setup)</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Quy trình 3 bước: thêm tên miền, publish bản ghi DNS do Brevo cấp, rồi xác thực để gửi From @domain.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 px-2 py-3 border-b border-slate-100 dark:border-slate-800 text-xs">
          {[
            { num: 1, label: 'Nhập Tên Miền' },
            { num: 2, label: 'Thêm Bản Ghi DNS' },
            { num: 3, label: 'Kiểm Tra & Hoàn Tất' },
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
                Xác thực tên miền giúp các nhà cung cấp hòm thư như Gmail, Outlook và Yahoo xác nhận bạn là chủ sở hữu hợp pháp.
              </p>
            </div>
          </div>
        )}

        {step === 2 && createdDomain && (
          <div className="space-y-4 py-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Tên miền đang cấu hình:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">
                      {createdDomain.domain}
                    </span>
                  </div>
                </div>
                <Badge variant="info" size="sm">
                  {records.length} bản ghi cần thêm
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200/60 dark:border-slate-800/60 pt-2">
                Sao chép các bản ghi DKIM & mã chứng thực độc quyền từ Brevo vào trang quản lý DNS của bạn (ví dụ: Spaceship, Cloudflare):
              </p>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="default" className="font-mono text-[10px]">
                        {rec.type}
                      </Badge>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {rec.name} ({rec.purpose})
                      </span>
                    </div>
                  </div>
                  {rec.description ? (
                    <p className="text-[10px] text-slate-400">{rec.description}</p>
                  ) : null}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between font-mono gap-2">
                      <span className="truncate">
                        Host: <strong>{rec.host}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(rec.host, `host-${rec.id}`)}
                        className="text-slate-400 hover:text-blue-600 transition cursor-pointer p-0.5 shrink-0"
                      >
                        {copiedKey === `host-${rec.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between font-mono gap-2">
                      <span className="truncate" title={rec.value}>
                        Value: <strong>{rec.value.slice(0, 28)}...</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(rec.value, `val-${rec.id}`)}
                        className="text-slate-400 hover:text-blue-600 transition cursor-pointer p-0.5 shrink-0"
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

            <div className="flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 p-2.5 rounded-xl">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Lưu ý:</strong> Sau khi thêm bản ghi trên nhà cung cấp tên miền, vui lòng chờ <strong>1–2 phút</strong> để hệ thống DNS xác thực xong rồi mới bấm xác minh.
              </span>
            </div>
          </div>
        )}

        {step === 3 && createdDomain && (
          <div className="space-y-4 py-4 text-xs">
            {!verificationDone ? (
              <div className="py-6 space-y-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center">
                  <RefreshCw className={`w-6 h-6 ${isVerifying ? 'animate-spin' : ''}`} />
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Kiểm Tra Tình Trạng Bản Ghi DNS
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Brevo đang kiểm tra đối soát trực tiếp với hệ thống DNS toàn cầu cho{' '}
                  <strong>{createdDomain.domain}</strong>. Vui lòng chờ <strong>1–2 phút</strong> sau khi lưu DNS để hệ thống xác thực xong.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isVerifying}
                  onClick={() => void handleVerifyStep3()}
                >
                  Bắt Đầu Kiểm Tra Ngay
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in-0">
                {createdDomain.status === 'VERIFIED' ? (
                  <div className="py-2 space-y-2 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-emerald-900 dark:text-emerald-200 text-base">
                      Xác Thực Tên Miền Thành Công!
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Tên miền <strong>{createdDomain.domain}</strong> đã sẵn sàng gắn với địa chỉ người gửi.
                    </p>
                  </div>
                ) : (
                  <div className="py-2 space-y-2 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-amber-900 dark:text-amber-200 text-base">
                      Chưa khớp đủ bản ghi ({createdDomain.status})
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Không thể gửi From @{createdDomain.domain} cho đến khi tất cả bản ghi VERIFIED.
                      Thử lại sau khi DNS lan truyền.
                    </p>
                  </div>
                )}

                <div className="space-y-2 text-left max-h-[220px] overflow-y-auto">
                  {records.map((rec) => {
                    const status = (rec.status || 'PENDING').toUpperCase()
                    const variant =
                      status === 'VERIFIED' ? 'success' : status === 'FAILED' ? 'danger' : 'warning'
                    return (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {rec.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {rec.purpose} · {rec.host}
                          </div>
                        </div>
                        <Badge variant={variant} size="sm" className="shrink-0 font-bold">
                          {status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>

                {createdDomain.status !== 'VERIFIED' && (
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isLoading={isVerifying}
                      onClick={() => void handleVerifyStep3()}
                    >
                      Kiểm tra lại
                    </Button>
                  </div>
                )}
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
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
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
              isLoading={isCreating}
              onClick={() => void handleNextStep2()}
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
              className={
                createdDomain?.status === 'VERIFIED'
                  ? 'bg-emerald-600 hover:bg-emerald-700 font-bold'
                  : 'font-bold'
              }
              onClick={handleFinish}
            >
              {createdDomain?.status === 'VERIFIED' ? 'Hoàn Tất & Đóng' : 'Đóng (chưa VERIFIED)'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddDomainWizardDialog
