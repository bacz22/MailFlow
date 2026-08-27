import React from 'react'
import { Sparkles, Code2 } from 'lucide-react'

export interface VariableItem {
  key: string
  label: string
  example: string
}

export const TEMPLATE_VARIABLES: VariableItem[] = [
  { key: '{{firstName}}', label: 'Tên Khách Hàng', example: 'Thành' },
  { key: '{{lastName}}', label: 'Họ & Đệm', example: 'Nguyễn Văn' },
  { key: '{{email}}', label: 'Địa Chỉ Email', example: 'thanh.nguyen@vcorp.vn' },
  { key: '{{company}}', label: 'Tên Công Ty', example: 'V-Corp Global' },
  { key: '{{phone}}', label: 'Số Điện Thoại', example: '+84 912 345 678' },
  { key: '{{unsubscribeUrl}}', label: 'Link Hủy Đăng Ký (RFC 8058)', example: 'https://mailflow.vn/unsub/...' },
]

export interface VariablePickerProps {
  onSelectVariable: (variableKey: string) => void
}

export const VariablePicker: React.FC<VariablePickerProps> = ({ onSelectVariable }) => {
  return (
    <div className="p-3 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Biến Cá Nhân Hóa (Dynamic Variables):</span>
        </div>
        <span className="text-[10px] text-blue-600/70">Nhấn vào biến để chèn vào nội dung</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {TEMPLATE_VARIABLES.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => onSelectVariable(v.key)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-xs font-mono font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition shadow-xs cursor-pointer group"
            title={`Chèn ${v.label} (Ví dụ: ${v.example})`}
          >
            <Code2 className="w-3 h-3 text-blue-500 group-hover:text-white" />
            <span>{v.key}</span>
            <span className="text-[10px] font-sans font-normal opacity-70 group-hover:opacity-100">
              ({v.label})
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default VariablePicker
