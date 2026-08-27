import React, { useState } from 'react'
import {
  Mail,
  Send,
  Plus,
  Trash2,
  Edit,
  Download,
  Settings,
  MoreVertical,
  Calendar,
  Sparkles,
  Users,
  Eye,
  Layers,
  DollarSign,
} from 'lucide-react'
import {
  Button,
  IconButton,
  Input,
  PasswordInput,
  EmailInput,
  SearchInput,
  Textarea,
  SimpleSelect,
  MultiSelect,
  Combobox,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Switch,
  DatePicker,
  TimePicker,
  DateTimePicker,
  Badge,
  StatusBadge,
  Avatar,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  ConfirmDialog,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Breadcrumb,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  MetricCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  Skeleton,
  Spinner,
  EmptyState,
  ErrorState,
  LoadingState,
  FormField,
  FormLabel,
  FormDescription,
  FormMessage,
  FormSection,
  useToast,
} from '../components/ui'
import type { StatusType } from '../components/ui'
import { PageContainer } from '../components/layout/PageContainer'

export const ComponentShowcase: React.FC = () => {
  const { showToast } = useToast()

  // Interactive Form State
  const [inputText, setInputText] = useState('')
  const [searchText, setSearchText] = useState('')
  const [emailText, setEmailText] = useState('marketing@mailflow.io')
  const [selectVal, setSelectVal] = useState('gmail')
  const [multiSelected, setMultiSelected] = useState<string[]>(['vip', 'tech'])
  const [comboboxVal, setComboboxVal] = useState('asia_hcm')
  const [checkboxChecked, setCheckboxChecked] = useState(true)
  const [radioVal, setRadioVal] = useState('instant')
  const [switchChecked, setSwitchChecked] = useState(true)
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [timeVal, setTimeVal] = useState('09:30')
  const [textareaVal, setTextareaVal] = useState('Chào mừng bạn đến với chiến dịch MailFlow mới nhất!')

  // Interactive Overlays State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [tableDensity, setTableDensity] = useState<'compact' | 'comfortable'>('compact')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRows, setSelectedRows] = useState<number[]>([1])

  const sampleSelectOptions = [
    { value: 'gmail', label: 'Google Workspace SMTP' },
    { value: 'ses', label: 'Amazon SES Dedicated IP' },
    { value: 'sendgrid', label: 'Twilio SendGrid API' },
    { value: 'resend', label: 'Resend Transactional' },
  ]

  const sampleComboboxOptions = [
    { value: 'asia_hcm', label: 'Asia/Ho_Chi_Minh (GMT+7)', description: 'Việt Nam Standard' },
    { value: 'asia_bkk', label: 'Asia/Bangkok (GMT+7)', description: 'Thailand' },
    { value: 'asia_sin', label: 'Asia/Singapore (GMT+8)', description: 'Singapore / Malaysia' },
    { value: 'asia_tyo', label: 'Asia/Tokyo (GMT+9)', description: 'Japan Standard' },
    { value: 'us_pst', label: 'America/Los_Angeles (PST)', description: 'US Pacific Time' },
  ]

  const sampleMultiOptions = [
    { value: 'vip', label: 'Khách Hàng VIP' },
    { value: 'tech', label: 'Khối Công Nghệ B2B' },
    { value: 'trial', label: 'Người Dùng Trial 14 Ngày' },
    { value: 'leads', label: 'Hot Leads Q3' },
    { value: 'churn', label: 'Có Nguy Cơ Rời Bỏ' },
    { value: 'partner', label: 'Đối Tác Chiến Lược' },
  ]

  const statuses: StatusType[] = [
    'draft',
    'scheduled',
    'pending',
    'approved',
    'sending',
    'completed',
    'paused',
    'cancelled',
    'failed',
    'active',
    'inactive',
    'verified',
    'unverified',
  ]

  const toggleRow = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((r) => r !== id))
    } else {
      setSelectedRows([...selectedRows, id])
    }
  }

  return (
    <PageContainer variant="wide" className="py-8 space-y-12">
      {/* Header Info */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MailFlow Shared UI Component Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Thư Viện Shared Components (/dev/components)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Toàn bộ bộ thành phần giao diện dùng chung theo Design System MailFlow. Đầy đủ các biến thể (variants), kích thước (sizes), trạng thái (default, hover, focus, disabled, readOnly, loading, error, success) và khả năng tương tác.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() =>
                showToast({
                  type: 'info',
                  title: 'Xuất mã nguồn',
                  description: 'Toàn bộ component đã sẵn sàng trong thư mục src/components/ui',
                })
              }
            >
              Tài Liệu UI
            </Button>
          </div>
        </div>
      </div>

      {/* 1. BUTTONS & ICON BUTTONS */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            1. Button & IconButton Components
          </h2>
          <p className="text-xs text-slate-500">
            Variants: Primary, Secondary, Outline, Ghost, Danger, Link | Sizes: sm (32px), md (38px), lg (44px), icon
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bộ Nút Bấm & Tương Tác</CardTitle>
            <CardDescription>Các trạng thái tiêu chuẩn hỗ trợ loading, disabled và icon prefix/suffix</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Variants */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Biến thể (Variants)
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Action</Button>
                <Button variant="link">Link Style</Button>
              </div>
            </div>

            {/* Sizes & Icons */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Kích thước (Sizes) & Icons
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Small (32px)
                </Button>
                <Button size="md" leftIcon={<Mail className="w-4 h-4" />}>
                  Medium (38px)
                </Button>
                <Button size="lg" rightIcon={<Send className="w-4 h-4" />}>
                  Large (44px)
                </Button>
              </div>
            </div>

            {/* States: Loading, Disabled, Icon Buttons */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Trạng thái (States) & IconButtons
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button isLoading>Đang lưu...</Button>
                <Button variant="secondary" isLoading>Đang tải</Button>
                <Button disabled>Bị vô hiệu hóa</Button>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

                <IconButton icon={<Edit className="w-4 h-4" />} aria-label="Chỉnh sửa" tooltip="Chỉnh sửa chiến dịch" />
                <IconButton icon={<Trash2 className="w-4 h-4 text-rose-500" />} aria-label="Xóa" tooltip="Xóa bản ghi" />
                <IconButton variant="outline" icon={<Settings className="w-4 h-4" />} aria-label="Cài đặt" />
                <IconButton variant="primary" icon={<Plus className="w-4 h-4" />} aria-label="Thêm mới" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-slate-400">
            Kích thước chuẩn hóa theo Design System: SM (32px), MD (38px), LG (44px).
          </CardFooter>
        </Card>
      </section>

      {/* 2. COMPLETE INPUT STATES MATRIX */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            2. Ma Trận Đầy Đủ Trạng Thái Input (Input States Matrix)
          </h2>
          <p className="text-xs text-slate-500">
            Khắc phục triệt để lỗi viền thừa (Double Border Ring). Đầy đủ trạng thái: Default, Filled, Focus, Hover, Disabled, ReadOnly, Loading, Error, Success, Prefix/Suffix, Sizes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bảng Trực Quan Trạng Thái Input</CardTitle>
            <CardDescription>
              Kiểm tra các hiệu ứng tương tác, viền đơn sắc nét khi click (focus) hoàn toàn không còn lớp viền thứ hai.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* 1. Default State */}
              <FormField>
                <FormLabel>1. Mặc định (Default / Empty)</FormLabel>
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập tên chiến dịch..."
                />
                <FormDescription>Viền slate-300 tiêu chuẩn</FormDescription>
              </FormField>

              {/* 2. Email Input */}
              <FormField>
                <FormLabel required>2. Email Input (Leading Icon)</FormLabel>
                <EmailInput
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                />
                <FormDescription>Có icon email dẫn hướng</FormDescription>
              </FormField>

              {/* 3. Search Input */}
              <FormField>
                <FormLabel>3. Search Input (Clearable)</FormLabel>
                <SearchInput
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onClear={() => setSearchText('')}
                  placeholder="Tìm kiếm liên hệ, tags..."
                />
                <FormDescription>Nút X tự xuất hiện khi có chữ</FormDescription>
              </FormField>

              {/* 4. Password with Toggle */}
              <FormField>
                <FormLabel required>4. Password Input (Show/Hide)</FormLabel>
                <PasswordInput defaultValue="MailFlow@Secret2026!" />
                <FormDescription>Nút mắt bật/tắt mật khẩu</FormDescription>
              </FormField>

              {/* 5. Disabled State */}
              <FormField>
                <FormLabel>5. Bị Vô Hiệu Hóa (Disabled State)</FormLabel>
                <Input disabled defaultValue="Không thể chỉnh sửa" />
                <FormDescription>Màu nền xám, con trỏ not-allowed</FormDescription>
              </FormField>

              {/* 6. ReadOnly State */}
              <FormField>
                <FormLabel>6. Chỉ Đọc (ReadOnly State)</FormLabel>
                <Input readOnly defaultValue="TRACKING_ID_MF_2026_XYZ" />
                <FormDescription>Cho phép chọn/sao chép, không chỉnh sửa</FormDescription>
              </FormField>

              {/* 7. Loading State */}
              <FormField>
                <FormLabel>7. Đang Kiểm Tra (Loading State)</FormLabel>
                <Input isLoading defaultValue="kiem-tra-ten-mien.vn" />
                <FormDescription>Hiển thị spinner xoay bên phải</FormDescription>
              </FormField>

              {/* 8. Error State */}
              <FormField>
                <FormLabel required>8. Báo Lỗi (Error State)</FormLabel>
                <Input hasError defaultValue="invalid-email-address@" />
                <FormMessage error="Địa chỉ email không đúng cú pháp hợp lệ." />
              </FormField>

              {/* 9. Success State */}
              <FormField>
                <FormLabel>9. Hợp Lệ (Success / Verified State)</FormLabel>
                <Input hasSuccess defaultValue="contact@mailflow.io" />
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-flex items-center gap-1">
                  <span>✓ Domain đã được xác thực DKIM & SPF hợp lệ.</span>
                </p>
              </FormField>
            </div>

            {/* Prefix & Suffix & Sizing row */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tiền Tố (Prefix), Hậu Tố (Suffix) & Kích Thước (Sizes)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <FormField>
                  <FormLabel>Input với Tiền Tố (Prefix)</FormLabel>
                  <Input prefixText="https://" placeholder="app.domain.com" />
                </FormField>
                <FormField>
                  <FormLabel>Input với Hậu Tố (Suffix)</FormLabel>
                  <Input suffixText="@mailflow.io" placeholder="username" />
                </FormField>
                <FormField>
                  <FormLabel>Icon Hai Đầu (Currency)</FormLabel>
                  <Input
                    leftIcon={<DollarSign className="w-4 h-4" />}
                    rightIcon={<span className="text-xs font-mono font-bold text-slate-400">VNĐ</span>}
                    defaultValue="5,000,000"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <FormField>
                  <FormLabel>Size SM: 32px (Compact)</FormLabel>
                  <Input inputSize="sm" placeholder="Input sm (32px)..." />
                </FormField>
                <FormField>
                  <FormLabel>Size MD: 38px (Tiêu Chuẩn)</FormLabel>
                  <Input inputSize="md" placeholder="Input md (38px)..." />
                </FormField>
                <FormField>
                  <FormLabel>Size LG: 44px (Large / Auth)</FormLabel>
                  <Input inputSize="lg" placeholder="Input lg (44px)..." />
                </FormField>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. EXHAUSTIVE STATES MATRIX FOR SELECT, COMBOBOX & MULTISELECT */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            3. Ma Trận Đầy Đủ Trạng Thái: Select, Combobox & MultiSelect
          </h2>
          <p className="text-xs text-slate-500">
            Chi tiết 100% các trạng thái của 3 component lựa chọn: Default (Placeholder), Selected, Focus/Open, Disabled, Loading, Error, Success, và 3 Kích thước (SM/MD/LG).
          </p>
        </div>

        {/* 3.1 SELECT STATES */}
        <Card>
          <CardHeader>
            <CardTitle>3.1. SimpleSelect Component States</CardTitle>
            <CardDescription>Đầy đủ trạng thái của dropdown chọn đơn chuẩn (Radix Select)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormField>
                <FormLabel>1. Mặc định (Chưa chọn / Placeholder)</FormLabel>
                <SimpleSelect
                  placeholder="Chọn nhà cung cấp..."
                  options={sampleSelectOptions}
                />
                <FormDescription>Hiển thị placeholder</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>2. Đã Chọn Giá Trị (Interactive)</FormLabel>
                <SimpleSelect
                  value={selectVal}
                  onValueChange={setSelectVal}
                  options={sampleSelectOptions}
                />
                <FormDescription>Đang chọn: {selectVal}</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>3. Bị Vô Hiệu Hóa (Disabled State)</FormLabel>
                <SimpleSelect
                  disabled
                  defaultValue="ses"
                  options={sampleSelectOptions}
                />
                <FormDescription>Không thể click/mở dropdown</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>4. Đang Tải Dữ Liệu (Loading State)</FormLabel>
                <SimpleSelect
                  isLoading
                  placeholder="Đang tải danh sách..."
                  options={[]}
                />
                <FormDescription>Hiển thị spinner xoay bên phải</FormDescription>
              </FormField>

              <FormField>
                <FormLabel required>5. Trạng Thái Lỗi (Error State)</FormLabel>
                <SimpleSelect
                  hasError
                  placeholder="Chọn cổng gửi..."
                  options={sampleSelectOptions}
                />
                <FormMessage error="Vui lòng chọn một nhà cung cấp SMTP." />
              </FormField>

              <FormField>
                <FormLabel>6. Đã Xác Thực (Success State)</FormLabel>
                <SimpleSelect
                  hasSuccess
                  defaultValue="gmail"
                  options={sampleSelectOptions}
                />
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                  ✓ Kết nối SMTP hợp lệ
                </p>
              </FormField>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Kích Thước Select (Sizes: SM 32px / MD 38px / LG 44px)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <FormField>
                  <FormLabel>Select SM: 32px (Compact)</FormLabel>
                  <SimpleSelect size="sm" defaultValue="gmail" options={sampleSelectOptions} />
                </FormField>
                <FormField>
                  <FormLabel>Select MD: 38px (Tiêu Chuẩn)</FormLabel>
                  <SimpleSelect size="md" defaultValue="gmail" options={sampleSelectOptions} />
                </FormField>
                <FormField>
                  <FormLabel>Select LG: 44px (Large / Form nổi bật)</FormLabel>
                  <SimpleSelect size="lg" defaultValue="gmail" options={sampleSelectOptions} />
                </FormField>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3.2 COMBOBOX STATES */}
        <Card>
          <CardHeader>
            <CardTitle>3.2. Combobox Component States (Searchable Single Select)</CardTitle>
            <CardDescription>Trình chọn có ô tìm kiếm lọc nhanh kèm mô tả phụ bên dưới nhãn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormField>
                <FormLabel>1. Mặc định (Chưa chọn)</FormLabel>
                <Combobox
                  placeholder="Chọn múi giờ..."
                  options={sampleComboboxOptions}
                  onChange={() => {}}
                />
                <FormDescription>Click để mở ô tìm kiếm</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>2. Đã Chọn Giá Trị (Interactive)</FormLabel>
                <Combobox
                  value={comboboxVal}
                  onChange={setComboboxVal}
                  options={sampleComboboxOptions}
                />
                <FormDescription>Đang chọn: {comboboxVal}</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>3. Bị Vô Hiệu Hóa (Disabled State)</FormLabel>
                <Combobox
                  disabled
                  defaultValue="asia_hcm"
                  options={sampleComboboxOptions}
                  onChange={() => {}}
                />
                <FormDescription>Khóa thao tác</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>4. Đang Tải Danh Sách (Loading State)</FormLabel>
                <Combobox
                  isLoading
                  placeholder="Đang tải múi giờ..."
                  options={[]}
                  onChange={() => {}}
                />
                <FormDescription>Spinner xoay bên phải</FormDescription>
              </FormField>

              <FormField>
                <FormLabel required>5. Trạng Thái Lỗi (Error State)</FormLabel>
                <Combobox
                  hasError
                  placeholder="Chọn múi giờ..."
                  options={sampleComboboxOptions}
                  onChange={() => {}}
                />
                <FormMessage error="Múi giờ bắt buộc phải được thiết lập." />
              </FormField>

              <FormField>
                <FormLabel>6. Đã Khớp Múi Giờ (Success State)</FormLabel>
                <Combobox
                  hasSuccess
                  defaultValue="asia_hcm"
                  options={sampleComboboxOptions}
                  onChange={() => {}}
                />
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                  ✓ Khớp múi giờ máy chủ hệ thống
                </p>
              </FormField>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Kích Thước Combobox (Sizes: SM 32px / MD 38px / LG 44px)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <FormField>
                  <FormLabel>Combobox SM: 32px</FormLabel>
                  <Combobox size="sm" defaultValue="asia_hcm" options={sampleComboboxOptions} onChange={() => {}} />
                </FormField>
                <FormField>
                  <FormLabel>Combobox MD: 38px</FormLabel>
                  <Combobox size="md" defaultValue="asia_hcm" options={sampleComboboxOptions} onChange={() => {}} />
                </FormField>
                <FormField>
                  <FormLabel>Combobox LG: 44px</FormLabel>
                  <Combobox size="lg" defaultValue="asia_hcm" options={sampleComboboxOptions} onChange={() => {}} />
                </FormField>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3.3 MULTISELECT STATES */}
        <Card>
          <CardHeader>
            <CardTitle>3.3. MultiSelect Component States (Tags & Chips)</CardTitle>
            <CardDescription>Chọn nhiều mục hiển thị dạng chip, hỗ trợ xóa từng chip, xóa tất cả và overflow badge (+N)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField>
                <FormLabel>1. Mặc định (Chưa chọn mục nào)</FormLabel>
                <MultiSelect
                  placeholder="Chọn phân đoạn khách hàng..."
                  selected={[]}
                  onChange={() => {}}
                  options={sampleMultiOptions}
                />
                <FormDescription>Placeholder khi chưa có tag nào</FormDescription>
              </FormField>

              <FormField>
                <FormLabel required>2. Đã Chọn Tags (Interactive & Clearable)</FormLabel>
                <MultiSelect
                  selected={multiSelected}
                  onChange={setMultiSelected}
                  options={sampleMultiOptions}
                />
                <FormDescription>Đã chọn {multiSelected.length} phân đoạn (Click X để xóa tag)</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>3. Nhiều Tags với Giới Hạn Hiển Thị (+N Overflow)</FormLabel>
                <MultiSelect
                  selected={['vip', 'tech', 'trial', 'leads', 'churn']}
                  maxVisibleChips={2}
                  onChange={() => {}}
                  options={sampleMultiOptions}
                />
                <FormDescription>Hiển thị 2 chip đầu + huy hiệu "+3"</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>4. Bị Vô Hiệu Hóa (Disabled State)</FormLabel>
                <MultiSelect
                  disabled
                  selected={['vip', 'tech']}
                  onChange={() => {}}
                  options={sampleMultiOptions}
                />
                <FormDescription>Không thể mở menu hoặc bấm xóa chips</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>5. Đang Tải Tags (Loading State)</FormLabel>
                <MultiSelect
                  isLoading
                  placeholder="Đang tải danh sách tags..."
                  selected={[]}
                  onChange={() => {}}
                  options={[]}
                />
                <FormDescription>Spinner xoay bên phải</FormDescription>
              </FormField>

              <FormField>
                <FormLabel required>6. Báo Lỗi Chưa Chọn (Error State)</FormLabel>
                <MultiSelect
                  hasError
                  placeholder="Chọn ít nhất 1 phân đoạn..."
                  selected={[]}
                  onChange={() => {}}
                  options={sampleMultiOptions}
                />
                <FormMessage error="Phân đoạn người nhận không được để trống." />
              </FormField>

              <div className="md:col-span-2">
                <FormField>
                  <FormLabel>7. Đã Chọn Hợp Lệ (Success State)</FormLabel>
                  <MultiSelect
                    hasSuccess
                    selected={['vip', 'partner']}
                    onChange={() => {}}
                    options={sampleMultiOptions}
                  />
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                    ✓ 2 phân đoạn đã được xác thực gồm 2,450 liên hệ hợp lệ.
                  </p>
                </FormField>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Kích Thước MultiSelect (Sizes: SM 32px / MD 38px / LG 44px)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <FormField>
                  <FormLabel>MultiSelect SM: 32px</FormLabel>
                  <MultiSelect size="sm" selected={['vip']} options={sampleMultiOptions} onChange={() => {}} />
                </FormField>
                <FormField>
                  <FormLabel>MultiSelect MD: 38px</FormLabel>
                  <MultiSelect size="md" selected={['vip', 'tech']} options={sampleMultiOptions} onChange={() => {}} />
                </FormField>
                <FormField>
                  <FormLabel>MultiSelect LG: 44px</FormLabel>
                  <MultiSelect size="lg" selected={['vip', 'tech']} options={sampleMultiOptions} onChange={() => {}} />
                </FormField>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. SEPARATE MATRICES FOR DATE/TIME PICKERS, TEXTAREA & SELECTION CONTROLS */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            4. Ma Trận Đầy Đủ Trạng Thái: DatePicker, TimePicker, DateTimePicker, Textarea & Selection Controls
          </h2>
          <p className="text-xs text-slate-500">
            Khắc phục lỗi đè icon / nhân đôi icon trên DatePicker. Đầy đủ các trạng thái và kích thước chuẩn.
          </p>
        </div>

        {/* 4.1 DATEPICKER MATRIX */}
        <Card>
          <CardHeader>
            <CardTitle>4.1. DatePicker Component States</CardTitle>
            <CardDescription>Chọn ngày với icon Calendar tinh tế góc phải, hỗ trợ kích hoạt native calendar khi click</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormField>
                <FormLabel>1. Mặc định (Default / Chưa chọn)</FormLabel>
                <DatePicker onChange={() => {}} />
                <FormDescription>Ô trống có icon lịch bên phải</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>2. Đã Chọn Ngày (Interactive)</FormLabel>
                <DatePicker value={dateVal} onChange={setDateVal} />
                <FormDescription>Đang chọn: {dateVal}</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>3. Bị Vô Hiệu Hóa (Disabled)</FormLabel>
                <DatePicker disabled defaultValue="2026-12-31" />
                <FormDescription>Khóa chọn ngày</FormDescription>
              </FormField>

              <FormField>
                <FormLabel required>4. Báo Lỗi (Error State)</FormLabel>
                <DatePicker hasError />
                <FormMessage error="Ngày bắt đầu không được để trống." />
              </FormField>

              <FormField>
                <FormLabel>5. Hợp Lệ (Success State)</FormLabel>
                <DatePicker hasSuccess defaultValue="2026-09-01" />
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                  ✓ Ngày hợp lệ trong quý 3
                </p>
              </FormField>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Kích Thước DatePicker (Sizes: SM 32px / MD 38px / LG 44px)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <FormField>
                  <FormLabel>DatePicker SM: 32px</FormLabel>
                  <DatePicker size="sm" defaultValue="2026-09-01" />
                </FormField>
                <FormField>
                  <FormLabel>DatePicker MD: 38px</FormLabel>
                  <DatePicker size="md" defaultValue="2026-09-01" />
                </FormField>
                <FormField>
                  <FormLabel>DatePicker LG: 44px</FormLabel>
                  <DatePicker size="lg" defaultValue="2026-09-01" />
                </FormField>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4.2 TIMEPICKER MATRIX */}
        <Card>
          <CardHeader>
            <CardTitle>4.2. TimePicker Component States</CardTitle>
            <CardDescription>Chọn giờ với icon Đồng hồ góc phải, thao tác trực quan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormField>
                <FormLabel>1. Mặc định (Default)</FormLabel>
                <TimePicker onChange={() => {}} />
                <FormDescription>Chưa thiết lập giờ</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>2. Đã Chọn Giờ (Interactive)</FormLabel>
                <TimePicker value={timeVal} onChange={setTimeVal} />
                <FormDescription>Đang chọn: {timeVal}</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>3. Bị Vô Hiệu Hóa (Disabled)</FormLabel>
                <TimePicker disabled defaultValue="18:00" />
                <FormDescription>Khóa chọn giờ</FormDescription>
              </FormField>

              <FormField>
                <FormLabel required>4. Báo Lỗi (Error State)</FormLabel>
                <TimePicker hasError />
                <FormMessage error="Vui lòng chọn khung giờ gửi hợp lệ." />
              </FormField>

              <FormField>
                <FormLabel>5. Hợp Lệ (Success State)</FormLabel>
                <TimePicker hasSuccess defaultValue="09:30" />
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                  ✓ Khung giờ vàng mở email
                </p>
              </FormField>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Kích Thước TimePicker (Sizes: SM 32px / MD 38px / LG 44px)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <FormField>
                  <FormLabel>TimePicker SM: 32px</FormLabel>
                  <TimePicker size="sm" defaultValue="09:30" />
                </FormField>
                <FormField>
                  <FormLabel>TimePicker MD: 38px</FormLabel>
                  <TimePicker size="md" defaultValue="09:30" />
                </FormField>
                <FormField>
                  <FormLabel>TimePicker LG: 44px</FormLabel>
                  <TimePicker size="lg" defaultValue="09:30" />
                </FormField>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4.3 DATETIMEPICKER COMBO */}
        <Card>
          <CardHeader>
            <CardTitle>4.3. Tổ Hợp DateTimePicker (Ngày & Giờ kết hợp)</CardTitle>
            <CardDescription>Kết nối liền mạch giữa chọn Ngày và Giờ trong một dòng nhập liệu duy nhất</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField>
              <FormLabel>DateTimePicker Tiêu Chuẩn (Interactive)</FormLabel>
              <DateTimePicker
                dateValue={dateVal}
                timeValue={timeVal}
                onDateChange={setDateVal}
                onTimeChange={setTimeVal}
              />
              <FormDescription>Đang thiết lập gửi lúc: {dateVal} vào {timeVal}</FormDescription>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <FormField>
                <FormLabel>DateTimePicker Bị Vô Hiệu Hóa</FormLabel>
                <DateTimePicker disabled dateValue="2026-12-31" timeValue="23:59" />
              </FormField>
              <FormField>
                <FormLabel required>DateTimePicker Báo Lỗi</FormLabel>
                <DateTimePicker hasError />
                <FormMessage error="Thời gian kích hoạt không thể trong quá khứ." />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* 4.4 TEXTAREA MATRIX */}
        <Card>
          <CardHeader>
            <CardTitle>4.4. Textarea Component States</CardTitle>
            <CardDescription>Hỗ trợ đếm ký tự (showCount), giới hạn (maxLength), Disabled, ReadOnly, Error, Success</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField>
                <FormLabel>1. Textarea với Bộ Đếm Ký Tự (Interactive)</FormLabel>
                <Textarea
                  value={textareaVal}
                  onChange={(e) => setTextareaVal(e.target.value)}
                  maxLength={200}
                  showCount
                />
                <FormDescription>Tự động đếm và giới hạn ký tự</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>2. Textarea Chỉ Đọc (ReadOnly)</FormLabel>
                <Textarea
                  readOnly
                  defaultValue="Mẫu hợp đồng dịch vụ email marketing tuân thủ điều khoản MailFlow 2026."
                />
                <FormDescription>Cho phép chọn/copy, không chỉnh sửa</FormDescription>
              </FormField>

              <FormField>
                <FormLabel>3. Textarea Bị Vô Hiệu Hóa (Disabled)</FormLabel>
                <Textarea
                  disabled
                  defaultValue="Nội dung không thể chỉnh sửa trong chế độ xem trước."
                />
                <FormDescription>Khóa chỉnh sửa</FormDescription>
              </FormField>

              <FormField>
                <FormLabel required>4. Textarea Báo Lỗi (Error State)</FormLabel>
                <Textarea
                  hasError
                  defaultValue="Nội dung chứa từ khóa bị cấm..."
                />
                <FormMessage error="Phát hiện từ khóa có nguy cơ bị đánh dấu spam." />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* 4.5 CHECKBOX, RADIO, SWITCH */}
        <Card>
          <CardHeader>
            <CardTitle>4.5. Checkbox, RadioGroup & Switch Components</CardTitle>
            <CardDescription>Các thành phần chọn nhiều, chọn đơn và công tắc toggle</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Checkbox States</h4>
                <div className="space-y-3">
                  <Checkbox
                    checked={checkboxChecked}
                    onCheckedChange={(c) => setCheckboxChecked(!!c)}
                    label="Theo dõi lượt mở (Checked)"
                    description="Gắn pixel theo dõi vô hình chuẩn xác"
                  />
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => {}}
                    label="Theo dõi lượt nhấp (Unchecked)"
                  />
                  <Checkbox
                    checked={true}
                    indeterminate
                    label="Trạng thái Indeterminate (Chọn một phần)"
                  />
                  <Checkbox disabled label="Disabled Unchecked" />
                  <Checkbox disabled checked label="Disabled Checked" />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Radio Group States</h4>
                <RadioGroup value={radioVal} onValueChange={setRadioVal}>
                  <RadioGroupItem value="instant" label="Gửi ngay lập tức" description="Xếp vào hàng đợi gửi ngay" />
                  <RadioGroupItem value="scheduled" label="Gửi theo lịch hẹn" description="Thiết lập thời gian chính xác" />
                  <RadioGroupItem value="batch" label="Gửi chia nhỏ theo đợt (Throttling)" description="Tránh bị chặn bởi ISP" />
                  <RadioGroupItem value="disabled_item" disabled label="Tùy chọn nâng cao (Disabled)" />
                </RadioGroup>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Switch Toggle States</h4>
                <div className="space-y-4">
                  <Switch
                    checked={switchChecked}
                    onCheckedChange={setSwitchChecked}
                    label="Tự động hủy đăng ký (RFC 8058)"
                    description="Đang bật (Active)"
                  />
                  <Switch
                    checked={false}
                    onCheckedChange={() => {}}
                    label="Gửi bản sao lưu (Unchecked)"
                    description="Đang tắt (Off)"
                  />
                  <Switch disabled label="Bật xác thực 2 bước (Disabled Checked)" checked />
                  <Switch disabled label="Chế độ bảo trì (Disabled Off)" checked={false} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4.6 FORMSECTION COMPONENT */}
        <Card>
          <CardHeader>
            <CardTitle>4.6. FormSection Component (Phân Nhóm & Bố Cục Biểu Mẫu)</CardTitle>
            <CardDescription>Cung cấp tiêu đề nhóm, mô tả phụ, đường phân cách và bố cục lưới responsive (1 cột / 2 cột)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormSection title="Nhóm Thông Tin Chiến Dịch (2 Cột)" description="Bố cục 2 cột tự động chuyển thành 1 cột trên thiết bị di động" columns={2}>
              <FormField>
                <FormLabel required>Tên Nhóm</FormLabel>
                <Input defaultValue="Chiến Dịch Email Marketing 2026" />
              </FormField>
              <FormField>
                <FormLabel>Mã Định Danh</FormLabel>
                <Input readOnly defaultValue="CAMP_2026_Q3_V1" />
              </FormField>
            </FormSection>

            <FormSection title="Cấu Hình Nâng Cao (1 Cột)" description="Bố cục toàn chiều rộng cho các trường dữ liệu dài" columns={1}>
              <FormField>
                <FormLabel>Ghi Chú Triển Khai</FormLabel>
                <Input placeholder="Nhập ghi chú quan trọng..." />
              </FormField>
            </FormSection>
          </CardContent>
        </Card>
      </section>

      {/* 5. STATUS BADGES & BADGES */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            5. Badge & StatusBadge Components (13 Trạng Thái Chuẩn)
          </h2>
          <p className="text-xs text-slate-500">
            Kết hợp Icon trực quan và Nhãn Text để đảm bảo Accessibility (Không dùng màu làm tín hiệu duy nhất)
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                13 Trạng Thái Chiến Dịch & Hệ Thống (StatusBadge)
              </h4>
              <div className="flex flex-wrap items-center gap-2.5">
                {statuses.map((st) => (
                  <StatusBadge key={st} status={st} />
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Standard Badges & Sizes
              </h4>
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="default">Default Blue</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="neutral">Neutral</Badge>
                <Badge size="sm" variant="success">
                  Small (10px)
                </Badge>
                <Badge size="lg" variant="default" icon={<Sparkles className="w-3.5 h-3.5" />}>
                  Large with Icon
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 6. OVERLAYS: DIALOG, CONFIRM, DRAWER, POPOVER, DROPDOWN, TOOLTIP */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            6. Overlay & Modal Components (Radix UI Wrapped)
          </h2>
          <p className="text-xs text-slate-500">
            Dialog, ConfirmDialog, Drawer, Popover, DropdownMenu, Tooltip (Hỗ trợ ESC, Focus Trap, Backdrop Blur)
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="primary">Mở Dialog Modal</Button>
                </DialogTrigger>
                <DialogContent size="md">
                  <DialogHeader>
                    <DialogTitle>Tạo Mẫu Email Mới</DialogTitle>
                    <DialogDescription>
                      Điền thông tin ban đầu để khởi tạo mẫu email trong hệ thống MailFlow.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <FormField>
                      <FormLabel required>Tên Template</FormLabel>
                      <Input placeholder="Ví dụ: Welcome Email 2026" />
                    </FormField>
                    <FormField>
                      <FormLabel>Chủ đề mặc định</FormLabel>
                      <Input placeholder="Ví dụ: Chào mừng bạn gia nhập MailFlow!" />
                    </FormField>
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                      Hủy bỏ
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setIsDialogOpen(false)
                        showToast({ type: 'success', title: 'Tạo thành công', description: 'Template mới đã được lưu nháp' })
                      }}
                    >
                      Tạo Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
                Mở ConfirmDialog (Xóa)
              </Button>
              <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Xác nhận xóa chiến dịch này?"
                description="Hành động này không thể hoàn tác. Mọi dữ liệu phân tích và lịch gửi sẽ bị xóa vĩnh viễn khỏi hệ thống."
                confirmText="Xóa vĩnh viễn"
                variant="danger"
                onConfirm={() => {
                  setIsConfirmOpen(false)
                  showToast({ type: 'error', title: 'Đã xóa', description: 'Chiến dịch đã được xóa thành công.' })
                }}
              />

              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline">Mở Drawer Panel (Slide-over)</Button>
                </DrawerTrigger>
                <DrawerContent size="md">
                  <DrawerHeader>
                    <DrawerTitle>Chi Tiết Liên Hệ (Contact Profile)</DrawerTitle>
                    <DrawerDescription>Thông tin chi tiết và lịch sử tương tác email</DrawerDescription>
                  </DrawerHeader>
                  <div className="space-y-4 py-2 flex-1 overflow-y-auto">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <Avatar fallbackText="Nguyễn Văn A" size="lg" status="online" />
                      <div>
                        <div className="font-bold text-sm">Nguyễn Văn An</div>
                        <div className="text-xs text-slate-500">an.nguyen@techcorp.vn</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase">Thống Kê Tương Tác</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="text-slate-400">Email Nhận</div>
                          <div className="font-bold text-base mt-1">24</div>
                        </div>
                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="text-slate-400">Open Rate</div>
                          <div className="font-bold text-base text-emerald-600 mt-1">87.5%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DrawerFooter>
                    <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>Đóng</Button>
                    <Button variant="primary">Chỉnh Sửa Liên Hệ</Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" rightIcon={<MoreVertical className="w-4 h-4" />}>
                    Menu Hành Động
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Tùy chọn chiến dịch</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Chỉnh sửa nội dung
                    <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Layers className="w-4 h-4 mr-2" />
                    Nhân bản (Duplicate)
                    <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="danger">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa chiến dịch
                    <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Popover Info</Button>
                </PopoverTrigger>
                <PopoverContent className="space-y-2">
                  <h4 className="font-bold text-sm">Hạn ngạch gửi tháng này</h4>
                  <p className="text-xs text-slate-500">
                    Bạn đã sử dụng <strong>145,000 / 500,000</strong> email (29%). Hạn ngạch sẽ tự động làm mới vào ngày 01 hàng tháng.
                  </p>
                </PopoverContent>
              </Popover>

              <Tooltip content="Tooltip giải thích chi tiết khi hover hoặc focus">
                <Button variant="ghost">Hover Tooltip Test</Button>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 7. NAVIGATION: TABS, BREADCRUMB, AVATAR */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            7. Navigation & Hierarchy (Tabs, Breadcrumb, Avatar)
          </h2>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Breadcrumb</h4>
              <Breadcrumb
                items={[
                  { label: 'Trang Chủ', href: '#' },
                  { label: 'Chiến Dịch Email', href: '#' },
                  { label: 'Chiến Dịch Mùa Thu #2026' },
                ]}
              />
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tabs (Pill Variant)</h4>
              <Tabs defaultValue="all">
                <TabsList variant="pills">
                  <TabsTrigger value="all" badge={12}>Tất Cả</TabsTrigger>
                  <TabsTrigger value="active" badge={4}>Đang Chạy</TabsTrigger>
                  <TabsTrigger value="draft" badge={6}>Bản Nháp</TabsTrigger>
                  <TabsTrigger value="completed">Đã Gửi</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs">
                  Hiển thị toàn bộ 12 chiến dịch trong hệ thống.
                </TabsContent>
                <TabsContent value="active" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs">
                  Hiển thị 4 chiến dịch đang chạy live.
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tabs (Underline Variant)</h4>
              <Tabs defaultValue="settings">
                <TabsList variant="underline">
                  <TabsTrigger variant="underline" value="settings">Cài Đặt Chung</TabsTrigger>
                  <TabsTrigger variant="underline" value="domains">Tên Miền & Senders</TabsTrigger>
                  <TabsTrigger variant="underline" value="members">Thành Viên & Quyền</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Avatar Sizing & Status</h4>
              <div className="flex items-center gap-3">
                <Avatar fallbackText="Tran B" size="sm" status="online" />
                <Avatar fallbackText="Le C" size="md" status="busy" />
                <Avatar fallbackText="Pham D" size="lg" status="away" />
                <Avatar fallbackText="Hoang E" size="xl" status="offline" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 8. DATA DISPLAY: METRIC CARDS & FULL DATA TABLE */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              8. MetricCard & Responsive Table với Pagination
            </h2>
            <p className="text-xs text-slate-500">
              Hỗ trợ Density Compact (40px) & Comfortable (52px), sticky action column, selectable rows
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Table Density:</span>
            <Button
              size="sm"
              variant={tableDensity === 'compact' ? 'primary' : 'outline'}
              onClick={() => setTableDensity('compact')}
            >
              Compact (40px)
            </Button>
            <Button
              size="sm"
              variant={tableDensity === 'comfortable' ? 'primary' : 'outline'}
              onClick={() => setTableDensity('comfortable')}
            >
              Comfortable (52px)
            </Button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Tổng Liên Hệ"
            value="142,850"
            change="+8.4%"
            trend="up"
            icon={<Users className="w-5 h-5" />}
            tooltip="Tổng số contact hợp lệ trong danh bạ"
          />
          <MetricCard
            label="Tỷ Lệ Mở (Open Rate)"
            value="68.2%"
            change="+3.1%"
            trend="up"
            icon={<Eye className="w-5 h-5" />}
            tooltip="Tính trên tổng số email đã được mở"
          />
          <MetricCard
            label="Tỷ Lệ Nhấp (CTR)"
            value="24.5%"
            change="-0.8%"
            trend="down"
            icon={<Send className="w-5 h-5" />}
          />
          <MetricCard
            label="Chi Phí Dự Kiến / Email"
            value="₫14.2"
            change="0.0%"
            trend="neutral"
            icon={<Calendar className="w-5 h-5" />}
          />
        </div>

        {/* Full Table */}
        <Card className="overflow-hidden">
          <Table density={tableDensity}>
            <TableHeader>
              <tr>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === 4}
                    onChange={(e) => setSelectedRows(e.target.checked ? [1, 2, 3, 4] : [])}
                    className="rounded border-slate-300"
                  />
                </TableHead>
                <TableHead className="min-w-[220px]">Tên Chiến Dịch</TableHead>
                <TableHead className="min-w-[140px]">Trạng Thái</TableHead>
                <TableHead className="min-w-[110px] tabular-nums">Tổng Gửi</TableHead>
                <TableHead className="min-w-[100px] tabular-nums">Open Rate</TableHead>
                <TableHead className="min-w-[100px] tabular-nums">CTR</TableHead>
                <TableHead className="min-w-[140px]">Ngày Gửi</TableHead>
                <TableHead stickyRight className="w-24 text-right">
                  Hành Động
                </TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {[
                { id: 1, name: 'Khuyến Mãi Black Friday 2026', status: 'sending', sent: '120,000', open: '65.2%', ctr: '22.4%', date: '26/08/2026 14:00' },
                { id: 2, name: 'Onboarding Khách Hàng Doanh Nghiệp', status: 'active', sent: '14,250', open: '78.1%', ctr: '31.2%', date: '25/08/2026 09:15' },
                { id: 3, name: 'Bản Tin Công Nghệ Tuần 34', status: 'completed', sent: '45,800', open: '54.0%', ctr: '18.9%', date: '24/08/2026 08:30' },
                { id: 4, name: 'Email Giỏ Hàng Chưa Thanh Toán', status: 'paused', sent: '2,100', open: '42.1%', ctr: '12.0%', date: '23/08/2026 18:00' },
              ].map((row) => {
                const isSelected = selectedRows.includes(row.id)
                return (
                  <TableRow key={row.id} selected={isSelected}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(row.id)}
                        className="rounded border-slate-300"
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                      {row.name}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status as StatusType} />
                    </TableCell>
                    <TableCell className="tabular-nums font-mono">{row.sent}</TableCell>
                    <TableCell className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {row.open}
                    </TableCell>
                    <TableCell className="tabular-nums font-mono">{row.ctr}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{row.date}</TableCell>
                    <TableCell stickyRight className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <IconButton
                          iconSize="sm"
                          icon={<Edit className="w-3.5 h-3.5" />}
                          aria-label="Sửa"
                          onClick={() => showToast({ type: 'info', title: 'Chỉnh sửa', description: row.name })}
                        />
                        <IconButton
                          iconSize="sm"
                          icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                          aria-label="Xóa"
                          onClick={() => setIsConfirmOpen(true)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={5}
            totalItems={48}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      </section>

      {/* 9. FEEDBACK & STATES: TOAST, SKELETON, SPINNER, EMPTY, ERROR */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            9. Feedback, Loading & State Views
          </h2>
          <p className="text-xs text-slate-500">
            Toast Triggers, Skeleton loaders, Spinners, EmptyState, ErrorState, LoadingState
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Kích hoạt thông báo (Toast Notifications)
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    showToast({
                      type: 'success',
                      title: 'Gửi chiến dịch thành công!',
                      description: '14,250 email đã được đưa vào hàng đợi gửi.',
                    })
                  }
                >
                  Toast Success
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    showToast({
                      type: 'error',
                      title: 'Lỗi xác thực DKIM/SPF',
                      description: 'Domain techcorp.vn chưa cấu hình bản ghi TXT chính xác.',
                    })
                  }
                >
                  Toast Error
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    showToast({
                      type: 'warning',
                      title: 'Cảnh báo hạn ngạch',
                      description: 'Bạn đã sử dụng 85% hạn ngạch email của tháng này.',
                    })
                  }
                >
                  Toast Warning
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    showToast({
                      type: 'info',
                      title: 'Hệ thống bảo trì',
                      description: 'Hệ thống sẽ cập nhật lúc 02:00 sáng Chủ Nhật.',
                    })
                  }
                >
                  Toast Info
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Skeleton Placeholders, Spinners & LoadingState
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                </div>

                <div className="space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-around">
                    <Spinner size="sm" />
                    <Spinner size="md" />
                    <Spinner size="lg" />
                    <Spinner size="xl" />
                  </div>
                  <LoadingState message="Đang nạp dữ liệu thống kê..." size="sm" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
              <EmptyState
                title="Chưa có chiến dịch nào"
                description="Bắt đầu kết nối với khách hàng bằng cách tạo chiến dịch email tự động đầu tiên của bạn."
                actionText="Tạo Chiến Dịch Mới"
                onAction={() => showToast({ type: 'info', title: 'Tạo chiến dịch' })}
              />

              <ErrorState
                title="Không thể tải danh sách liên hệ"
                description="Máy chủ phản hồi mã lỗi 503. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau."
                onRetry={() => showToast({ type: 'success', title: 'Đang kết nối lại...' })}
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </PageContainer>
  )
}

export default ComponentShowcase
