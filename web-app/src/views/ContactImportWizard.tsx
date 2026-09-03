import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Download,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'
import { SimpleSelect, type SelectOption } from '../components/ui/Select'
import { useToast } from '../components/ui/Toast'
import excelIcon from '../assets/icon/icon-excel.svg'

const TARGET_FIELD_OPTIONS: SelectOption[] = [
  {
    value: 'email',
    textValue: 'Địa chỉ Email (Bắt buộc) *',
    label: (
      <span>
        Địa chỉ Email (Bắt buộc) <span className="text-rose-600 dark:text-rose-500 font-bold ml-0.5">*</span>
      </span>
    ),
  },
  { value: 'firstName', label: 'Tên (First Name)' },
  { value: 'lastName', label: 'Họ & Tên đệm (Last Name)' },
  { value: 'fullName', label: 'Họ và Tên đầy đủ' },
  { value: 'company', label: 'Tên Công Ty' },
  { value: 'phone', label: 'Số Điện Thoại' },
  { value: 'custom_job_title', label: 'Tạo trường: Chức danh' },
  { value: 'custom_city', label: 'Tạo trường: Thành phố' },
  { value: 'skip', label: '-- Bỏ qua cột này --' },
]

function getTargetFieldOptions(currentValue: string): SelectOption[] {
  if (currentValue && !TARGET_FIELD_OPTIONS.some((opt) => opt.value === currentValue)) {
    return [...TARGET_FIELD_OPTIONS, { value: currentValue, label: `Trường: ${currentValue}` }]
  }
  return TARGET_FIELD_OPTIONS
}
import { ApiError } from '../services/apiClient'
import { contactService, type ImportContactRow, type ImportContactsResult } from '../services/contact.service'
import { listService } from '../services/list.service'
import {
  analyzeImportRows,
  buildMappings,
  formatFileSize,
  isSupportedContactImportFile,
  mapRowsToImportPayload,
  parseContactImportFile,
  type ColumnMapping,
  type ParsedCsvFile,
} from '../utils/contactCsvImport'
import { downloadContactImportTemplate } from '../utils/contactImportTemplate'

export interface ContactImportWizardProps {
  onNavigate: (path: string) => void
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6

export const ContactImportWizard: React.FC<ContactImportWizardProps> = ({ onNavigate }) => {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [file, setFile] = useState<{ name: string; size: string; rowCount: number } | null>(null)
  const [parsedCsv, setParsedCsv] = useState<ParsedCsvFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [importRows, setImportRows] = useState<ImportContactRow[]>([])
  const [duplicateAction, setDuplicateAction] = useState<'update' | 'skip'>('skip')
  const [skipInvalid, setSkipInvalid] = useState<boolean>(true)
  const [targetList, setTargetList] = useState<string>('')
  const [availableLists, setAvailableLists] = useState<Array<{ id: string; name: string }>>([])
  const [targetTag, setTargetTag] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportContactsResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [sampleDownloadState, setSampleDownloadState] = useState<'idle' | 'loading' | 'done'>('idle')
  const sampleDownloadResetRef = useRef<number | null>(null)

  const analysis = useMemo(() => analyzeImportRows(importRows), [importRows])
  const previewRows = useMemo(() => importRows.slice(0, 5), [importRows])
  const backPath = targetList ? `/lists/${targetList}` : '/contacts'

  useEffect(() => {
    const prefill = new URLSearchParams(window.location.search).get('listId')?.trim()
    if (prefill) {
      setTargetList(prefill)
    }
    listService
      .list()
      .then((rows) => setAvailableLists(rows.map((list) => ({ id: list.id, name: list.name }))))
      .catch(() => setAvailableLists([]))
  }, [])

  useEffect(() => {
    return () => {
      if (sampleDownloadResetRef.current != null) {
        window.clearTimeout(sampleDownloadResetRef.current)
      }
    }
  }, [])

  const runImport = async () => {
    if (isImporting || importRows.length === 0) {
      return
    }

    setImportResult(null)
    setProgress(15)
    setIsImporting(true)
    setCurrentStep(5)

    try {
      setProgress(45)
      const result = await contactService.import({
        duplicateAction: duplicateAction === 'update' ? 'UPDATE' : 'SKIP',
        skipInvalid,
        tags: targetTag.trim() ? [targetTag.trim()] : [],
        listId: targetList || undefined,
        rows: importRows,
      })
      setProgress(100)
      setImportResult(result)
      setCurrentStep(6)
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không nạp được danh bạ',
        description: error instanceof ApiError ? error.detail : 'Vui lòng thử lại.',
      })
      setProgress(0)
      setCurrentStep(4)
    } finally {
      setIsImporting(false)
    }
  }

  const stepsConfig = [
    { num: 1, label: 'Tải File' },
    { num: 2, label: 'Ghép Cột' },
    { num: 3, label: 'Xác Thực' },
    { num: 4, label: 'Xem Trước' },
    { num: 5, label: 'Đang Nạp' },
    { num: 6, label: 'Kết Quả' },
  ]

  const handleFileUpload = async (uploadedFile: File) => {
    if (!isSupportedContactImportFile(uploadedFile.name)) {
      showToast({
        type: 'error',
        title: 'Định dạng không hỗ trợ',
        description: 'Vui lòng dùng file .CSV, .XLS hoặc .XLSX.',
      })
      return
    }

    try {
      const parsed = await parseContactImportFile(uploadedFile)
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        throw new Error('File trống hoặc không đọc được sheet danh bạ.')
      }
      if (parsed.rows.length > 5000) {
        throw new Error('Mỗi lần nạp tối đa 5000 dòng.')
      }

      const mappings = buildMappings(parsed)
      setParsedCsv(parsed)
      setMappings(mappings)
      setImportRows(mapRowsToImportPayload(parsed, mappings))
      setFile({
        name: uploadedFile.name,
        size: formatFileSize(uploadedFile.size),
        rowCount: parsed.rows.length,
      })
      showToast({
        type: 'success',
        title: 'Đã tải file lên',
        description: `Đã nạp thành công file ${uploadedFile.name} (${parsed.rows.length.toLocaleString('vi-VN')} dòng).`,
      })
    } catch (error) {
      setFile(null)
      setParsedCsv(null)
      setMappings([])
      setImportRows([])
      showToast({
        type: 'error',
        title: 'Không đọc được file',
        description: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      })
    }
  }

  const handleDownloadSample = () => {
    if (sampleDownloadState !== 'idle') {
      return
    }

    setSampleDownloadState('loading')

    window.setTimeout(() => {
      try {
        downloadContactImportTemplate()
        setSampleDownloadState('done')
        showToast({
          type: 'success',
          title: 'Đã tải file mẫu',
          description: 'Kiểm tra thư mục Tải xuống. Điền dữ liệu rồi kéo thả file .xls/.xlsx/.csv vào ô bên dưới.',
        })
        if (sampleDownloadResetRef.current != null) {
          window.clearTimeout(sampleDownloadResetRef.current)
        }
        sampleDownloadResetRef.current = window.setTimeout(() => {
          setSampleDownloadState('idle')
          sampleDownloadResetRef.current = null
        }, 2500)
      } catch {
        setSampleDownloadState('idle')
        showToast({
          type: 'error',
          title: 'Không tải được file mẫu',
          description: 'Vui lòng thử lại.',
        })
      }
    }, 350)
  }

  const updateMapping = (index: number, newTarget: string) => {
    setMappings((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], targetField: newTarget }
      if (parsedCsv) {
        setImportRows(mapRowsToImportPayload(parsedCsv, updated))
      }
      return updated
    })
  }

  const resetWizard = () => {
    setFile(null)
    setParsedCsv(null)
    setMappings([])
    setImportRows([])
    setImportResult(null)
    setProgress(0)
    setIsImporting(false)
    setCurrentStep(1)
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
            onClick={() => onNavigate(backPath)}
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
          <CardHeader className="space-y-4">
            <div className="space-y-1">
              <CardTitle className="text-base">Bước 1: Tải Lên Tập Tin Danh Bạ</CardTitle>
              <CardDescription className="text-xs">
                Hỗ trợ <strong>.CSV</strong>, <strong>.XLS</strong>, <strong>.XLSX</strong> (tối đa 5.000 dòng mỗi lần nạp).
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/25">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-100">
                    Tải mẫu danh bạ MailFlow
                  </div>
                  <div className="text-[11px] text-blue-800/75 dark:text-blue-300/80 leading-relaxed">
                    File Excel có sẵn tiêu đề và 3 dòng ví dụ. Điền dữ liệu rồi kéo thả trực tiếp vào ô bên dưới — không cần đổi sang CSV.
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                leftIcon={
                  sampleDownloadState === 'done' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )
                }
                isLoading={sampleDownloadState === 'loading'}
                disabled={sampleDownloadState !== 'idle'}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownloadSample()
                }}
              >
                {sampleDownloadState === 'done'
                  ? 'Đã tải xuống'
                  : sampleDownloadState === 'loading'
                    ? 'Đang tải...'
                    : 'Tải File Mẫu'}
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
                const uploaded = e.dataTransfer.files?.[0]
                if (uploaded) {
                  void handleFileUpload(uploaded)
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
                accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => {
                  const uploaded = e.target.files?.[0]
                  if (uploaded) {
                    void handleFileUpload(uploaded)
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
                  Hỗ trợ .CSV / .XLS / .XLSX — UTF-8 để không lỗi font tiếng Việt.
                </div>
              </div>
            </div>

            {/* Uploaded File Item Preview */}
            {file && (
              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-3 text-xs animate-in fade-in-0">
                <div className="flex items-center gap-3">
                  <img src={excelIcon} alt="Excel" className="w-9 h-9 shrink-0 object-contain" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{file.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {file.size} • <strong className="text-emerald-600 dark:text-emerald-400">{file.rowCount.toLocaleString()} dòng</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setParsedCsv(null)
                    setMappings([])
                    setImportRows([])
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  title="Xóa file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="outline" onClick={() => onNavigate(backPath)}>
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
                        <div className="w-full max-w-xs">
                          <SimpleSelect
                            size="sm"
                            value={m.targetField}
                            onValueChange={(val) => updateMapping(idx, val)}
                            options={getTargetFieldOptions(m.targetField)}
                          />
                        </div>
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
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Hợp Lệ (Duy Nhất)</div>
                <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {analysis.valid.toLocaleString('vi-VN')}
                </div>
                <div className="text-[10px] text-emerald-600/70">
                  {analysis.total > 0 ? `${Math.round((analysis.valid / analysis.total) * 1000) / 10}% tổng số` : '0% tổng số'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/20 space-y-1">
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">Trùng Lặp (Duplicate)</div>
                <div className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300">
                  {analysis.duplicates.toLocaleString('vi-VN')}
                </div>
                <div className="text-[10px] text-blue-600/70">
                  {analysis.duplicates > 0 ? `${analysis.duplicates} dòng lặp trong file` : 'Không trùng trong file'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 space-y-1">
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">Email Không Hợp Lệ</div>
                <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
                  {(analysis.invalid - analysis.missingEmail).toLocaleString('vi-VN')}
                </div>
                <div className="text-[10px] text-amber-600/70">Sai cú pháp RFC</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/20 space-y-1">
                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">Thiếu Email</div>
                <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">
                  {analysis.missingEmail.toLocaleString('vi-VN')}
                </div>
                <div className="text-[10px] text-rose-600/70">Dòng trống trường bắt buộc</div>
              </div>
            </div>

            {/* In-file Duplicate Warning Alert Banner */}
            {analysis.duplicates > 0 && (
              <div className="rounded-2xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/30 p-4 space-y-3 animate-in fade-in-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        Phát hiện {analysis.duplicates} dòng trùng lặp email trong file tải lên!
                      </div>
                      <div className="text-xs text-amber-800/85 dark:text-amber-300/85 mt-0.5">
                        Nút <strong>"Tiếp Tục"</strong> đã bị khóa. Vui lòng kiểm tra chi tiết các dòng bên dưới, chỉnh sửa hoặc xóa bớt các dòng trùng lặp trong file rồi nạp lại.
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 bg-white dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-950/60"
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                    onClick={() => setCurrentStep(1)}
                  >
                    Tải lại file đã sửa
                  </Button>
                </div>

                <div className="border border-amber-200 dark:border-amber-900/60 rounded-xl overflow-hidden bg-white/90 dark:bg-slate-900/90">
                  <div className="px-3.5 py-2 bg-amber-100/60 dark:bg-amber-950/50 text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between border-b border-amber-200 dark:border-amber-900/60">
                    <span>Chi tiết các dòng bị trùng lặp cần chỉnh sửa:</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {analysis.duplicateDetails.length} dòng trùng
                    </span>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-amber-100/70 dark:divide-slate-800 text-xs">
                    {analysis.duplicateDetails.map((dup, idx) => (
                      <div
                        key={idx}
                        className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                      >
                        <div className="flex items-center gap-2 font-mono">
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[11px]">
                            Dòng {dup.rowNumber}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {dup.email}
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-700 dark:text-amber-400">
                          Trùng với email ở{' '}
                          <strong className="font-bold text-slate-900 dark:text-slate-100">
                            Dòng {dup.firstSeenRowNumber}
                          </strong>{' '}
                          (đã xuất hiện trước đó)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
                <span>Tự động bỏ qua {analysis.invalid.toLocaleString('vi-VN')} dòng có lỗi cú pháp hoặc thiếu email để tiếp tục nạp</span>
              </label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setCurrentStep(2)}>
              Quay Lại
            </Button>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {analysis.duplicates > 0 && (
                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  Vui lòng sửa {analysis.duplicates} dòng trùng lặp để tiếp tục
                </span>
              )}
              <Button
                variant="primary"
                disabled={analysis.duplicates > 0 || analysis.valid === 0}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => setCurrentStep(4)}
              >
                Tiếp Tục: Xem Trước & Phân Bổ
              </Button>
            </div>
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
                <SimpleSelect
                  value={targetList || '__none__'}
                  onValueChange={(val) => setTargetList(val === '__none__' ? '' : val)}
                  options={[
                    { value: '__none__', label: 'Không gán danh sách' },
                    ...availableLists.map((list) => ({
                      value: list.id,
                      label: list.name,
                    })),
                  ]}
                  placeholder="Chọn danh sách..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Gắn Thẻ Phân Khúc (Tag):
                </label>
                <Input
                  value={targetTag}
                  onChange={(e) => setTargetTag(e.target.value)}
                  placeholder="Nhập tên thẻ tag..."
                />
              </div>
            </div>

            {/* Preview Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>Xem trước 5 bản ghi mẫu</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  Ước tính nạp: {analysis.valid.toLocaleString('vi-VN')} liên hệ
                </span>
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
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-bold">
                          {[row.lastName, row.firstName].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">{row.email || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{row.company || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{row.phone || '—'}</td>
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
              isLoading={isImporting}
              disabled={analysis.valid === 0}
              onClick={() => void runImport()}
            >
              Bắt Đầu Nạp ({analysis.valid.toLocaleString('vi-VN')} Liên Hệ)
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
                <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {(importResult?.created ?? 0).toLocaleString('vi-VN')}
                </div>
                <div className="text-[10px] text-emerald-600/80">Liên hệ mới</div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/20 text-center space-y-1">
                <div className="text-xs font-semibold text-blue-600">Đã Cập Nhật</div>
                <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300">
                  {(importResult?.updated ?? 0).toLocaleString('vi-VN')}
                </div>
                <div className="text-[10px] text-blue-600/80">Trùng lặp ghi đè</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 text-center space-y-1">
                <div className="text-xs font-semibold text-amber-600">Bị Bỏ Qua</div>
                <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">
                  {((importResult?.skipped ?? 0) + (importResult?.invalid ?? 0)).toLocaleString('vi-VN')}
                </div>
                <div className="text-[10px] text-amber-600/80">Trùng lặp hoặc email lỗi</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                <div className="text-xs font-semibold text-slate-500">Thất Bại</div>
                <div className="text-2xl font-bold font-mono text-slate-700 dark:text-slate-300">
                  {(importResult?.errors?.length ?? 0).toLocaleString('vi-VN')}
                </div>
                <div className="text-[10px] text-slate-400">Mẫu lỗi trả về</div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              disabled={!importResult?.errors?.length}
              onClick={() =>
                showToast({
                  type: 'info',
                  title: 'Báo cáo lỗi',
                  description: 'Chi tiết lỗi đã hiển thị trong kết quả import.',
                })
              }
            >
              Tải Báo Cáo Lỗi (.CSV)
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={resetWizard}
              >
                Nạp File Khác
              </Button>

              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => onNavigate(backPath)}
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
