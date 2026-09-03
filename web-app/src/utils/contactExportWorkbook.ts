/** Styled SpreadsheetML workbook for contact export (opens nicely in Excel). */

export interface ContactExportRow {
  email: string
  firstName: string
  lastName: string
  company: string
  phone: string
  status: string
  tags: string
  createdAt: string
}

const EXPORT_HEADERS = [
  'Email',
  'Tên',
  'Họ và tên đệm',
  'Công ty',
  'Số điện thoại',
  'Trạng thái',
  'Thẻ (Tags)',
  'Ngày tạo',
] as const

const COLUMN_WIDTHS = [210, 90, 130, 150, 130, 110, 140, 150]

const STATUS_LABELS: Record<string, string> = {
  active: 'Hoạt động',
  unsubscribed: 'Hủy đăng ký',
  bounced: 'Bounced',
  invalid: 'Không hợp lệ',
  blocked: 'Đã chặn',
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cell(value: string, styleId?: string): string {
  const styleAttr = styleId ? ` ss:StyleID="${styleId}"` : ''
  return `<Cell${styleAttr}><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`
}

function formatStatus(status: string): string {
  const key = status.trim().toLowerCase()
  return STATUS_LABELS[key] ?? status
}

function formatCreatedAt(value: string): string {
  if (!value.trim()) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

function formatTags(value: string): string {
  return value
    .split(/[|,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(', ')
}

export function mapCsvRecordsToExportRows(
  headers: string[],
  rows: string[][]
): ContactExportRow[] {
  const indexOf = (name: string) => headers.findIndex((h) => h.trim().toLowerCase() === name)

  const emailIdx = indexOf('email')
  const firstIdx = indexOf('first_name')
  const lastIdx = indexOf('last_name')
  const companyIdx = indexOf('company')
  const phoneIdx = indexOf('phone')
  const statusIdx = indexOf('status')
  const tagsIdx = indexOf('tags')
  const createdIdx = indexOf('created_at')

  const get = (row: string[], index: number) => (index >= 0 ? row[index] ?? '' : '')

  return rows.map((row) => ({
    email: get(row, emailIdx),
    firstName: get(row, firstIdx),
    lastName: get(row, lastIdx),
    company: get(row, companyIdx),
    phone: get(row, phoneIdx),
    status: get(row, statusIdx),
    tags: get(row, tagsIdx),
    createdAt: get(row, createdIdx),
  }))
}

export function buildContactExportWorkbookXml(records: ContactExportRow[]): string {
  const columnsXml = COLUMN_WIDTHS.map((width) => `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`).join(
    ''
  )

  const headerRow = `<Row ss:AutoFitHeight="0" ss:Height="24">${EXPORT_HEADERS.map((h) =>
    cell(h, 'Header')
  ).join('')}</Row>`

  const dataRows = records
    .map((record, index) => {
      const values = [
        record.email,
        record.firstName,
        record.lastName,
        record.company,
        record.phone,
        formatStatus(record.status),
        formatTags(record.tags),
        formatCreatedAt(record.createdAt),
      ]
      const style = index % 2 === 0 ? 'DataEven' : 'DataOdd'
      return `<Row ss:AutoFitHeight="0" ss:Height="20">${values.map((value) => cell(value, style)).join('')}</Row>`
    })
    .join('')

  const rowCount = records.length + 1
  const filterRange = `R1C1:R${Math.max(rowCount, 1)}C8`

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>MailFlow — Danh bạ liên hệ</Title>
  <Author>MailFlow</Author>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1D4ED8"/>
   </Borders>
  </Style>
  <Style ss:ID="DataEven">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataOdd">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0F172A"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Danh ba">
  <Table ss:ExpandedColumnCount="8" ss:ExpandedRowCount="${rowCount}" x:FullColumns="1" x:FullRows="1">
   ${columnsXml}
   ${headerRow}
   ${dataRows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
  <AutoFilter x:Range="${filterRange}" xmlns="urn:schemas-microsoft-com:office:excel"/>
 </Worksheet>
</Workbook>`
}

export function downloadContactExportWorkbook(records: ContactExportRow[], filename?: string): void {
  const xml = buildContactExportWorkbookXml(records)
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  anchor.href = url
  anchor.download = filename ?? `MailFlow_Danh_Ba_${stamp}.xls`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
