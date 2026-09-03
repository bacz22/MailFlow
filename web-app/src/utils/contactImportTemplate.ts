/** SpreadsheetML template — opens in Excel with header styling & column widths (no deps). */

const TEMPLATE_HEADERS = ['email', 'first_name', 'last_name', 'company', 'phone'] as const

const TEMPLATE_ROWS: string[][] = [
  ['thanh.nguyen@vcorp.vn', 'Thành', 'Nguyễn Văn', 'V-Corp Global', '+84 912 345 678'],
  ['mai.tran@acmesoft.vn', 'Mai', 'Trần Thị', 'Acme Soft', '+84 987 654 321'],
  ['minh.le@startup.io', 'Minh', 'Lê Hoàng', 'Startup IO', '+84 901 234 567'],
]

const COLUMN_WIDTHS = [220, 100, 120, 160, 130]

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cell(value: string, styleId?: string, type: 'String' | 'Number' = 'String'): string {
  const styleAttr = styleId ? ` ss:StyleID="${styleId}"` : ''
  return `<Cell${styleAttr}><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`
}

function instructionRow(text: string, styleId: string): string {
  return `<Row ss:AutoFitHeight="1" ss:Height="18">${cell(text, styleId)}</Row>`
}

/**
 * Builds a MailFlow contact import sample as SpreadsheetML (.xls).
 * Opens in Excel/Google Sheets with styled headers and readable column widths.
 * Users should Save As → CSV UTF-8 before uploading to the wizard.
 */
export function buildContactImportTemplateXml(): string {
  const columnsXml = COLUMN_WIDTHS.map((width) => `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`).join(
    ''
  )

  const headerRow = `<Row ss:AutoFitHeight="0" ss:Height="22">${TEMPLATE_HEADERS.map((h) =>
    cell(h, 'Header')
  ).join('')}</Row>`

  const dataRows = TEMPLATE_ROWS.map(
    (row, index) =>
      `<Row ss:AutoFitHeight="0" ss:Height="20">${row
        .map((value) => cell(value, index % 2 === 0 ? 'DataEven' : 'DataOdd'))
        .join('')}</Row>`
  ).join('')

  const guideRows = [
    instructionRow('HƯỚNG DẪN NẠP DANH BẠ MAILFLOW', 'GuideTitle'),
    instructionRow('1. Giữ nguyên dòng tiêu đề (email, first_name, last_name, company, phone).', 'GuideBody'),
    instructionRow('2. Thay / thêm dòng dữ liệu bên dưới. Cột email là bắt buộc.', 'GuideBody'),
    instructionRow('3. Lưu file rồi kéo thả trực tiếp vào MailFlow (.xls / .xlsx / .csv đều được).', 'GuideBody'),
    instructionRow('4. Không đổi tên cột; có thể để trống company hoặc phone.', 'GuideBody'),
    instructionRow('', 'GuideBody'),
    instructionRow('Cột được hỗ trợ:', 'GuideTitle'),
    instructionRow('email — địa chỉ email nhận thư (bắt buộc)', 'GuideBody'),
    instructionRow('first_name — tên', 'GuideBody'),
    instructionRow('last_name — họ và tên đệm', 'GuideBody'),
    instructionRow('company — công ty / tổ chức', 'GuideBody'),
    instructionRow('phone — số điện thoại', 'GuideBody'),
  ].join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>MailFlow — Mẫu danh bạ</Title>
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
  <Style ss:ID="GuideTitle">
   <Font ss:FontName="Calibri" ss:Size="12" ss:Color="#1E40AF" ss:Bold="1"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="GuideBody">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#334155"/>
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Danh ba">
  <Table ss:ExpandedColumnCount="5" ss:ExpandedRowCount="${TEMPLATE_ROWS.length + 1}" x:FullColumns="1" x:FullRows="1">
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
 </Worksheet>
 <Worksheet ss:Name="Huong dan">
  <Table ss:ExpandedColumnCount="1" ss:ExpandedRowCount="12" x:FullColumns="1" x:FullRows="1">
   <Column ss:AutoFitWidth="0" ss:Width="520"/>
   ${guideRows}
  </Table>
 </Worksheet>
</Workbook>`
}

export function downloadContactImportTemplate(): void {
  const xml = buildContactImportTemplateXml()
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'MailFlow_Mau_Danh_Ba.xls'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/** Plain UTF-8 CSV twin — useful if the user prefers CSV-only workflow. */
export function downloadContactImportTemplateCsv(): void {
  const lines = [
    TEMPLATE_HEADERS.join(','),
    ...TEMPLATE_ROWS.map((row) =>
      row.map((value) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)).join(',')
    ),
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'MailFlow_Mau_Danh_Ba.csv'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
