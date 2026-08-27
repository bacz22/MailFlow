import React, { useState, useEffect, useRef } from 'react'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Download,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'

export interface ContactImportWizardProps {
  onNavigate: (path: string) => void
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6

interface ColumnMapping {
  csvHeader: string
  sampleValue: string
  targetField: string
}

export const ContactImportWizard: React.FC<ContactImportWizardProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step state
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)

  // Step 1: Upload state
  const [file, setFile] = useState<{ name: string; size: string; rowCount: number } | null>({
    name: 'enterprise_customers_q3.csv',
    size: '1.42 MB',
    rowCount: 5442,
  })
  const [isDragging, setIsDragging] = useState(false)

  // Step 2: Column Mapping state
  const [mappings, setMappings] = useState<ColumnMapping[]>([
    { csvHeader: 'email_address', sampleValue: 'thanh.nguyen@vcorp.vn', targetField: 'email' },
    { csvHeader: 'first_name', sampleValue: 'Thành', targetField: 'firstName' },
    { csvHeader: 'last_name', sampleValue: 'Nguyễn Văn', targetField: 'lastName' },
    { csvHeader: 'company_name', sampleValue: 'V-Corp Global', targetField: 'company' },
    { csvHeader: 'phone_number', sampleValue: '+84 912 345 678', targetField: 'phone' },
    { csvHeader: 'job_title', sampleValue: 'Marketing Director', targetField: 'custom_job_title' },
  ])

  // Step 3: Conflict options
  const [duplicateAction, setDuplicateAction] = useState<'update' | 'skip'>('update')
  const [skipInvalid, setSkipInvalid] = useState<boolean>(true)
  const [targetList, setTargetList] = useState<string>('VIP Enterprise')
  const [targetTag, setTargetTag] = useState<string>('Import-Q3-2026')

  // Step 5: Progress simulation
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (currentStep === 5) {
      setProgress(0)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setTimeout(() => setCurrentStep(6), 500)
            return 100
          }
          return prev + 15
        })
      }, 300)
      return () => clearInterval(interval)
    }
  }, [currentStep])

  const stepsConfig = [
    { num: 1, label: 'Tải File' },
    { num: 2, label: 'Ghép Cột' },
    { num: 3, label: 'Xác Thực' },
    { num: 4, label: 'Xem Trước' },
    { num: 5, label: 'Đang Nạp' },
    { num: 6, label: 'Kết Quả' },
  ]

  const handleFileUpload = (fileName = 'contacts_database.csv') => {
    setFile({
      name: fileName,
      size: '2.1 MB',
      rowCount: 5442,
    })
    showToast({
      type: 'success',
      title: 'Đã tải file lên',
      description: `Đã nạp thành công file ${fileName} (5,442 dòng).`,
    })
  }

  const handleDownloadSample = () => {
    showToast({
      type: 'info',
      title: 'Tải file mẫu',
      description: 'Đang tải file mẫu chuẩn contacts_template.csv...',
    })
  }

  const updateMapping = (index: number, newTarget: string) => {
    setMappings((prev) => {
      const updated = [...prev]
      updated[index].targetField = newTarget
      return updated
    })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Trình Nạp Danh Bạ (Contact Import Wizard)"
        description="Nạp danh sách hàng loạt từ file CSV/Excel với cơ chế tự động khớp cột, kiểm tra trùng lặp và xác thực chuẩn RFC."
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

      {/* 2. STEPPER PROGRESS BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <div className="flex items-center justify-between relative">
          {/* Background Connecting Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />

          {stepsConfig.map((s) => {
            const isCompleted = currentStep > s.num
            const isCurrent = currentStep === s.num

            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center group">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md shadow-blue-500/30 scale-110'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${
                    isCurrent
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : isCompleted
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. STEP CONTENT CARDS */}

      {/* ================= STEP 1: UPLOAD FILE ================= */}
      {currentStep === 1 && (
        <Card className="animate-in fade-in-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">Bước 1: Tải Lên Tập Tin Danh Bạ</CardTitle>
                <CardDescription className="text-xs">
                  Hỗ trợ các định dạng .CSV, .XLSX (tối đa 50MB hoặc 500,000 dòng mỗi lượt nạp).
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 dark:text-blue-400"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={handleDownloadSample}
              >
                Tải File Mẫu (.CSV)
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer.files?.[0]) {
                  handleFileUpload(e.dataTransfer.files[0].name)
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0].name)
                  }
                }}
              />

              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                <Upload className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Kéo thả file vào đây hoặc <span className="text-blue-600 underline">duyệt từ máy tính</span>
                </div>
                <div className="text-xs text-slate-400">
                  Hỗ trợ UTF-8 encoding để không bị lỗi font tiếng Việt có dấu.
                </div>
              </div>
            </div>

            {/* Uploaded File Item Preview */}
            {file && (
              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-3 text-xs animate-in fade-in-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{file.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {file.size} • <strong className="text-emerald-600 dark:text-emerald-400">{file.rowCount.toLocaleString()} dòng</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  title="Xóa file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="outline" onClick={() => onNavigate('/contacts')}>
              Hủy
            </Button>
            <Button
              variant="primary"
              disabled={!file}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setCurrentStep(2)}
            >
              Tiếp Tục: Ghép Cột
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 2: COLUMN MAPPING ================= */}
      {currentStep === 2 && (
        <Card className="animate-in fade-in-0">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="text-base">Bước 2: Ghép Cột Dữ Liệu (Column Mapping)</CardTitle>
              <CardDescription className="text-xs">
                Khớp các tiêu đề trong file CSV với các trường thông tin tương ứng trong hệ thống MailFlow.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-y border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Cột Trong File CSV</th>
                    <th className="py-2.5 px-3">Dữ Liệu Mẫu (Dòng 1)</th>
                    <th className="py-2.5 px-4">Trường Đích Trên MailFlow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mappings.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {m.csvHeader}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono truncate max-w-xs">
                        {m.sampleValue}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={m.targetField}
                          onChange={(e) => updateMapping(idx, e.target.value)}
                          className="w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus-ring cursor-pointer"
                        >
                          <option value="email">Địa chỉ Email (Bắt buộc) *</option>
                          <option value="firstName">Tên (First Name)</option>
                          <option value="lastName">Họ & Tên đệm (Last Name)</option>
                          <option value="fullName">Họ và Tên đầy đủ</option>
                          <option value="company">Tên Công Ty</option>
                          <option value="phone">Số Điện Thoại</option>
                          <option value="custom_job_title">Tạo trường: Chức danh</option>
                          <option value="custom_city">Tạo trường: Thành phố</option>
                          <option value="skip">-- Bỏ qua cột này --</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setCurrentStep(1)}>
              Quay Lại
            </Button>
            <Button
              variant="primary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setCurrentStep(3)}
            >
              Tiếp Tục: Xác Thực
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 3: VALIDATION & CONFLICT ================= */}
      {currentStep === 3 && (
        <Card className="animate-in fade-in-0">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="text-base">Bước 3: Kết Quả Kiểm Tra & Cấu Hình Xử Lý</CardTitle>
              <CardDescription className="text-xs">
                Tổng hợp chất lượng dữ liệu nạp và cấu hình xử lý trường hợp trùng lặp hoặc email không hợp lệ.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Validation Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Hợp Lệ (Valid)</div>
                <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">5,382</div>
                <div className="text-[10px] text-emerald-600/70">99.6% tổng số</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/20 space-y-1">
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">Trùng Lặp (Duplicate)</div>
                <div className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300">42</div>
                <div className="text-[10px] text-blue-600/70">Đã tồn tại trong hệ thống</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 space-y-1">
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">Email Không Hợp Lệ</div>
                <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">12</div>
                <div className="text-[10px] text-amber-600/70">Sai cú pháp RFC</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/20 space-y-1">
                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">Thiếu Email</div>
                <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">6</div>
                <div className="text-[10px] text-rose-600/70">Dòng trống trường bắt buộc</div>
              </div>
            </div>

            {/* Conflict Resolution Settings */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                Tùy Chọn Xử Lý Trùng Lặp & Lỗi:
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer">
                  <input
                    type="radio"
                    name="duplicateAction"
                    checked={duplicateAction === 'update'}
                    onChange={() => setDuplicateAction('update')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Cập nhật thông tin các liên hệ đã tồn tại (Update existing)
                    </div>
                    <div className="text-slate-400">Ghi đè tên, số điện thoại, công ty từ file mới.</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer">
                  <input
                    type="radio"
                    name="duplicateAction"
                    checked={duplicateAction === 'skip'}
                    onChange={() => setDuplicateAction('skip')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Bỏ qua các liên hệ trùng lặp (Skip duplicate)
                    </div>
                    <div className="text-slate-400">Giữ nguyên hồ sơ cũ, chỉ nạp thêm liên hệ hoàn toàn mới.</div>
                  </div>
                </label>
              </div>

              {/* Checkbox auto skip invalid */}
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={skipInvalid}
                  onChange={(e) => setSkipInvalid(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Tự động bỏ qua 18 dòng có lỗi cú pháp hoặc thiếu email để tiếp tục nạp</span>
              </label>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setCurrentStep(2)}>
              Quay Lại
            </Button>
            <Button
              variant="primary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setCurrentStep(4)}
            >
              Tiếp Tục: Xem Trước & Phân Bổ
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 4: PREVIEW ================= */}
      {currentStep === 4 && (
        <Card className="animate-in fade-in-0">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="text-base">Bước 4: Xem Trước Dữ Liệu & Phân Bổ Danh Sách</CardTitle>
              <CardDescription className="text-xs">
                Xem trước 5 bản ghi đầu tiên và chỉ định danh sách / thẻ tag áp dụng cho đợt nạp này.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Target List & Tag Selection Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Thêm vào Danh Sách:
                </label>
                <select
                  value={targetList}
                  onChange={(e) => setTargetList(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus-ring"
                >
                  <option value="VIP Enterprise">VIP Enterprise Clients</option>
                  <option value="Webinar Leads">Webinar Leads Q3</option>
                  <option value="Newsletter Subscribers">General Newsletter</option>
                  <option value="Trial Users">14-day Free Trial</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Gắn Thẻ Phân Khúc (Tag):
                </label>
                <input
                  type="text"
                  value={targetTag}
                  onChange={(e) => setTargetTag(e.target.value)}
                  placeholder="Nhập tên thẻ tag..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold focus-ring"
                />
              </div>
            </div>

            {/* Preview Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>Xem trước 5 bản ghi mẫu</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">Ước tính nạp: 5,424 liên hệ</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/60 dark:bg-slate-900 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Họ và Tên</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Công Ty</th>
                      <th className="py-2 px-3">Số Điện Thoại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[
                      { name: 'Nguyễn Văn Thành', email: 'thanh.nguyen@vcorp.vn', comp: 'V-Corp Global', phone: '+84 912 345 678' },
                      { name: 'Trần Minh Anh', email: 'minhanh.tran@techlead.io', comp: 'TechLead Solutions', phone: '+84 988 123 456' },
                      { name: 'Phạm Thu Hương', email: 'huong.pham@fintech.asia', comp: 'Fintech Asia Hub', phone: '+84 903 555 789' },
                      { name: 'Hoàng Minh Đức', email: 'duc.hoang@logistics247.com', comp: 'Logistics 24/7', phone: '+84 977 444 333' },
                      { name: 'Vũ Ngọc Mai', email: 'mai.vu@designstudio.co', comp: 'Creative Studio', phone: '+84 918 222 111' },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-bold">{row.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">{row.email}</td>
                        <td className="py-2.5 px-3 text-slate-500">{row.comp}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{row.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setCurrentStep(3)}>
              Quay Lại
            </Button>
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => setCurrentStep(5)}
            >
              Bắt Đầu Nạp (5,424 Liên Hệ)
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ================= STEP 5: IMPORTING IN PROGRESS ================= */}
      {currentStep === 5 && (
        <Card className="animate-in fade-in-0 py-12 text-center">
          <CardContent className="space-y-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto shadow-md">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Đang Nạp Dữ Liệu Vào MailFlow...
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Đang xử lý phân tích cú pháp, kiểm tra danh sách và lập chỉ mục tìm kiếm thời gian thực.
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-slate-600 dark:text-slate-300">Tiến độ nạp:</span>
                <span className="text-blue-600">{progress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-xs">
              ⚠️ Vui lòng không đóng tab hoặc trình duyệt trong quá trình nạp.
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= STEP 6: RESULT ================= */}
      {currentStep === 6 && (
        <Card className="animate-in fade-in-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-md mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <CardTitle className="text-xl">Nạp Dữ Liệu Hoàn Tất!</CardTitle>
            <CardDescription className="text-xs">
              File <strong className="text-slate-800 dark:text-slate-200">{file?.name}</strong> đã được xử lý và nạp thành công vào hệ thống.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Result Stats Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 text-center space-y-1">
                <div className="text-xs font-semibold text-emerald-600">Đã Thêm Mới</div>
                <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">5,382</div>
                <div className="text-[10px] text-emerald-600/80">Liên hệ mới</div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/20 text-center space-y-1">
                <div className="text-xs font-semibold text-blue-600">Đã Cập Nhật</div>
                <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300">42</div>
                <div className="text-[10px] text-blue-600/80">Trùng lặp ghi đè</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 text-center space-y-1">
                <div className="text-xs font-semibold text-amber-600">Bị Bỏ Qua</div>
                <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">18</div>
                <div className="text-[10px] text-amber-600/80">Email lỗi cú pháp</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                <div className="text-xs font-semibold text-slate-500">Thất Bại</div>
                <div className="text-2xl font-bold font-mono text-slate-700 dark:text-slate-300">0</div>
                <div className="text-[10px] text-slate-400">Không có lỗi hệ thống</div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() =>
                showToast({
                  type: 'success',
                  title: 'Tải báo cáo lỗi',
                  description: 'Đang tải file 18_invalid_contacts_report.csv...',
                })
              }
            >
              Tải Báo Cáo 18 Dòng Lỗi (.CSV)
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFile(null)
                  setCurrentStep(1)
                }}
              >
                Nạp File Khác
              </Button>

              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('/contacts')}
              >
                Xem Danh Bạ Khách Hàng
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

export default ContactImportWizard
