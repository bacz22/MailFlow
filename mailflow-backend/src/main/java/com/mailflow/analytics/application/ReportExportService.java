package com.mailflow.analytics.application;

import com.mailflow.analytics.api.response.AnalyticsOverviewResponse;
import com.mailflow.analytics.api.response.AnalyticsTimeseriesResponse;
import com.mailflow.analytics.api.response.CampaignAnalyticsRowResponse;
import com.mailflow.analytics.api.response.CampaignReportResponse;
import com.mailflow.analytics.api.response.EngagementEventResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportExportService {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(VN);
    private static final DateTimeFormatter DAY =
            DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(VN);

    private static final byte[] BLUE = new byte[]{(byte) 37, (byte) 99, (byte) 235};
    private static final byte[] BLUE_SOFT = new byte[]{(byte) 239, (byte) 246, (byte) 255};
    private static final byte[] SLATE = new byte[]{(byte) 248, (byte) 250, (byte) 252};
    private static final byte[] BORDER = new byte[]{(byte) 226, (byte) 232, (byte) 240};

    private final AnalyticsService analyticsService;

    public byte[] exportCampaignReportXlsx(UUID userId, UUID workspaceId, UUID campaignId) {
        CampaignReportResponse report = analyticsService.campaignReport(userId, workspaceId, campaignId);
        Page<EngagementEventResponse> events = analyticsService.campaignEngagements(
                userId, workspaceId, campaignId, null, 0, 500);

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Styles styles = Styles.create(wb);

            Sheet summary = wb.createSheet("Tổng quan");
            writeTitle(summary, styles, "Báo cáo chiến dịch", report.getName());
            int r = 2;
            r = kvText(summary, styles, r, "Tên chiến dịch", report.getName());
            r = kvText(summary, styles, r, "Trạng thái", report.getStatus());
            r = kvLong(summary, styles, r, "Đã gửi", report.getSentCount());
            r = kvLong(summary, styles, r, "Thất bại", report.getFailedCount());
            r = kvLong(summary, styles, r, "Unique opens", report.getUniqueOpens());
            r = kvLong(summary, styles, r, "Unique clicks", report.getUniqueClicks());
            r = kvPct(summary, styles, r, "Tỷ lệ mở %", report.getOpenRate());
            r = kvPct(summary, styles, r, "Tỷ lệ click %", report.getClickRate());
            r = kvPct(summary, styles, r, "Tỷ lệ hủy ĐK %", report.getUnsubscribeRate());
            r = kvText(summary, styles, r, "Tỷ lệ bounce %", report.getBounceRate() + " (chưa có webhook)");
            r = kvText(summary, styles, r, "Bắt đầu", formatInstant(report.getStartedAt()));
            kvText(summary, styles, r, "Hoàn tất", formatInstant(report.getCompletedAt()));
            finishKvSheet(summary);

            Sheet links = wb.createSheet("Top links");
            writeTitle(links, styles, "Top links", report.getName());
            writeTableHeader(links, styles, 2, "URL", "Clicks");
            int lr = 3;
            for (CampaignReportResponse.TopLink link : report.getTopLinks()) {
                Row row = links.createRow(lr);
                boolean alt = (lr - 3) % 2 == 1;
                textCell(row, 0, link.getUrl(), styles.body(alt));
                longCell(row, 1, link.getClicks(), styles.number(alt));
                lr++;
            }
            finishTableSheet(links, 2, 2, lr);

            Sheet eng = wb.createSheet("Engagements");
            writeTitle(eng, styles, "Engagements", report.getName());
            writeTableHeader(eng, styles, 2, "Thời gian", "Email", "Loại", "URL");
            int er = 3;
            for (EngagementEventResponse e : events.getContent()) {
                Row row = eng.createRow(er);
                boolean alt = (er - 3) % 2 == 1;
                textCell(row, 0, formatInstant(e.getCreatedAt()), styles.body(alt));
                textCell(row, 1, e.getContactEmail(), styles.body(alt));
                textCell(row, 2, e.getEventType(), styles.body(alt));
                textCell(row, 3, e.getTargetUrl() == null ? "" : e.getTargetUrl(), styles.body(alt));
                er++;
            }
            finishTableSheet(eng, 2, 4, er);

            wb.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("EXPORT_XLSX_FAILED", ex);
        }
    }

    public byte[] exportAnalyticsXlsx(UUID userId, UUID workspaceId, Instant from, Instant to) {
        AnalyticsOverviewResponse overview = analyticsService.overview(userId, workspaceId, from, to);
        AnalyticsTimeseriesResponse series = analyticsService.timeseries(userId, workspaceId, from, to);
        List<CampaignAnalyticsRowResponse> campaigns = analyticsService.campaigns(userId, workspaceId, from, to);

        String period = DAY.format(from) + " → " + DAY.format(to) + " (GMT+7)";

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Styles styles = Styles.create(wb);

            Sheet summary = wb.createSheet("Tổng quan");
            writeTitle(summary, styles, "MailFlow Analytics", period);
            int r = 2;
            r = kvLong(summary, styles, r, "Email đã gửi", overview.getSent());
            r = kvLong(summary, styles, r, "Unique opens", overview.getUniqueOpens());
            r = kvLong(summary, styles, r, "Unique clicks", overview.getUniqueClicks());
            r = kvLong(summary, styles, r, "Hủy đăng ký", overview.getUnsubscribes());
            r = kvLong(summary, styles, r, "Gửi thất bại", overview.getFailed());
            r = kvPct(summary, styles, r, "Tỷ lệ mở %", overview.getOpenRate());
            r = kvPct(summary, styles, r, "Tỷ lệ click %", overview.getClickRate());
            kvPct(summary, styles, r, "Tỷ lệ hủy ĐK %", overview.getUnsubscribeRate());
            finishKvSheet(summary);

            Sheet camp = wb.createSheet("Chiến dịch");
            writeTitle(camp, styles, "Chiến dịch đã gửi", period);
            writeTableHeader(camp, styles, 2,
                    "Tên", "Gửi lúc", "Sent", "Delivery %", "Open %", "Click %", "Bounce %", "Unsub %");
            int cr = 3;
            for (CampaignAnalyticsRowResponse c : campaigns) {
                Row row = camp.createRow(cr);
                boolean alt = (cr - 3) % 2 == 1;
                textCell(row, 0, c.getName(), styles.body(alt));
                textCell(row, 1, formatInstant(c.getSentAt()), styles.body(alt));
                longCell(row, 2, c.getRecipientsSent(), styles.number(alt));
                pctCell(row, 3, c.getDeliveryRate(), styles.percent(alt));
                pctCell(row, 4, c.getOpenRate(), styles.percent(alt));
                pctCell(row, 5, c.getClickRate(), styles.percent(alt));
                pctCell(row, 6, c.getBounceRate(), styles.percent(alt));
                pctCell(row, 7, c.getUnsubscribeRate(), styles.percent(alt));
                cr++;
            }
            finishTableSheet(camp, 2, 8, cr);

            Sheet ts = wb.createSheet("Theo ngày");
            writeTitle(ts, styles, "Hiệu suất theo ngày", period);
            writeTableHeader(ts, styles, 2, "Ngày", "Sent", "Opened", "Clicked");
            int tr = 3;
            for (AnalyticsTimeseriesResponse.Point p : series.getPoints()) {
                Row row = ts.createRow(tr);
                boolean alt = (tr - 3) % 2 == 1;
                textCell(row, 0, p.getDate(), styles.body(alt));
                longCell(row, 1, p.getSent(), styles.number(alt));
                longCell(row, 2, p.getOpened(), styles.number(alt));
                longCell(row, 3, p.getClicked(), styles.number(alt));
                tr++;
            }
            finishTableSheet(ts, 2, 4, tr);

            wb.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("EXPORT_XLSX_FAILED", ex);
        }
    }

    private static void writeTitle(Sheet sheet, Styles styles, String title, String subtitle) {
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(title);
        titleCell.setCellStyle(styles.title);
        titleRow.setHeightInPoints(22);

        Row subRow = sheet.createRow(1);
        Cell subCell = subRow.createCell(0);
        subCell.setCellValue(subtitle == null ? "" : subtitle);
        subCell.setCellStyle(styles.subtitle);
        subRow.setHeightInPoints(16);
    }

    private static void writeTableHeader(Sheet sheet, Styles styles, int rowIdx, String... titles) {
        Row row = sheet.createRow(rowIdx);
        row.setHeightInPoints(18);
        for (int i = 0; i < titles.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(titles[i]);
            cell.setCellStyle(styles.header);
        }
        if (titles.length > 1) {
            sheet.createFreezePane(0, rowIdx + 1);
        }
    }

    private static int kvText(Sheet sheet, Styles styles, int rowIdx, String key, String value) {
        Row row = sheet.createRow(rowIdx);
        boolean alt = rowIdx % 2 == 0;
        textCell(row, 0, key, styles.label(alt));
        textCell(row, 1, value == null ? "" : value, styles.body(alt));
        return rowIdx + 1;
    }

    private static int kvLong(Sheet sheet, Styles styles, int rowIdx, String key, long value) {
        Row row = sheet.createRow(rowIdx);
        boolean alt = rowIdx % 2 == 0;
        textCell(row, 0, key, styles.label(alt));
        longCell(row, 1, value, styles.number(alt));
        return rowIdx + 1;
    }

    private static int kvPct(Sheet sheet, Styles styles, int rowIdx, String key, double value) {
        Row row = sheet.createRow(rowIdx);
        boolean alt = rowIdx % 2 == 0;
        textCell(row, 0, key, styles.label(alt));
        pctCell(row, 1, value, styles.percent(alt));
        return rowIdx + 1;
    }

    private static void textCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value == null ? "" : value);
        cell.setCellStyle(style);
    }

    private static void longCell(Row row, int col, long value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private static void pctCell(Row row, int col, double value, CellStyle style) {
        Cell cell = row.createCell(col);
        // API already returns percent points (e.g. 4.9), keep as number not Excel %
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private static void finishKvSheet(Sheet sheet) {
        sheet.setColumnWidth(0, 22 * 256);
        sheet.setColumnWidth(1, 36 * 256);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 1));
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 1));
    }

    private static void finishTableSheet(Sheet sheet, int headerRow, int cols, int endRowExclusive) {
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, Math.max(cols - 1, 0)));
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, Math.max(cols - 1, 0)));
        for (int i = 0; i < cols; i++) {
            sheet.autoSizeColumn(i);
            int width = sheet.getColumnWidth(i);
            sheet.setColumnWidth(i, Math.min(Math.max(width + 512, 12 * 256), 48 * 256));
        }
        if (endRowExclusive > headerRow + 1) {
            sheet.setAutoFilter(new CellRangeAddress(headerRow, endRowExclusive - 1, 0, cols - 1));
        }
    }

    private static String formatInstant(Instant instant) {
        if (instant == null) {
            return "";
        }
        return DT.format(instant);
    }

    private static final class Styles {
        final CellStyle title;
        final CellStyle subtitle;
        final CellStyle header;
        final CellStyle labelEven;
        final CellStyle labelOdd;
        final CellStyle bodyEven;
        final CellStyle bodyOdd;
        final CellStyle numberEven;
        final CellStyle numberOdd;
        final CellStyle percentEven;
        final CellStyle percentOdd;

        private Styles(
                CellStyle title,
                CellStyle subtitle,
                CellStyle header,
                CellStyle labelEven,
                CellStyle labelOdd,
                CellStyle bodyEven,
                CellStyle bodyOdd,
                CellStyle numberEven,
                CellStyle numberOdd,
                CellStyle percentEven,
                CellStyle percentOdd
        ) {
            this.title = title;
            this.subtitle = subtitle;
            this.header = header;
            this.labelEven = labelEven;
            this.labelOdd = labelOdd;
            this.bodyEven = bodyEven;
            this.bodyOdd = bodyOdd;
            this.numberEven = numberEven;
            this.numberOdd = numberOdd;
            this.percentEven = percentEven;
            this.percentOdd = percentOdd;
        }

        static Styles create(XSSFWorkbook wb) {
            Font titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleFont.setColor(IndexedColors.WHITE.getIndex());

            Font subtitleFont = wb.createFont();
            subtitleFont.setFontHeightInPoints((short) 10);
            subtitleFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());

            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 10);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            Font labelFont = wb.createFont();
            labelFont.setBold(true);
            labelFont.setFontHeightInPoints((short) 10);

            Font bodyFont = wb.createFont();
            bodyFont.setFontHeightInPoints((short) 10);

            XSSFCellStyle title = wb.createCellStyle();
            title.setFont(titleFont);
            title.setFillForegroundColor(rgb(BLUE));
            title.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            title.setVerticalAlignment(VerticalAlignment.CENTER);
            title.setAlignment(HorizontalAlignment.LEFT);
            applyBorder(title);

            XSSFCellStyle subtitle = wb.createCellStyle();
            subtitle.setFont(subtitleFont);
            subtitle.setFillForegroundColor(rgb(BLUE_SOFT));
            subtitle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            subtitle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorder(subtitle);

            XSSFCellStyle header = wb.createCellStyle();
            header.setFont(headerFont);
            header.setFillForegroundColor(rgb(BLUE));
            header.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            header.setAlignment(HorizontalAlignment.CENTER);
            header.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorder(header);

            return new Styles(
                    title,
                    subtitle,
                    header,
                    dataStyle(wb, labelFont, false, HorizontalAlignment.LEFT, null),
                    dataStyle(wb, labelFont, true, HorizontalAlignment.LEFT, null),
                    dataStyle(wb, bodyFont, false, HorizontalAlignment.LEFT, null),
                    dataStyle(wb, bodyFont, true, HorizontalAlignment.LEFT, null),
                    dataStyle(wb, bodyFont, false, HorizontalAlignment.RIGHT, "#,##0"),
                    dataStyle(wb, bodyFont, true, HorizontalAlignment.RIGHT, "#,##0"),
                    dataStyle(wb, bodyFont, false, HorizontalAlignment.RIGHT, "0.0"),
                    dataStyle(wb, bodyFont, true, HorizontalAlignment.RIGHT, "0.0")
            );
        }

        CellStyle label(boolean alt) {
            return alt ? labelOdd : labelEven;
        }

        CellStyle body(boolean alt) {
            return alt ? bodyOdd : bodyEven;
        }

        CellStyle number(boolean alt) {
            return alt ? numberOdd : numberEven;
        }

        CellStyle percent(boolean alt) {
            return alt ? percentOdd : percentEven;
        }

        private static XSSFCellStyle dataStyle(
                XSSFWorkbook wb,
                Font font,
                boolean alt,
                HorizontalAlignment align,
                String format
        ) {
            XSSFCellStyle style = wb.createCellStyle();
            style.setFont(font);
            style.setAlignment(align);
            style.setVerticalAlignment(VerticalAlignment.CENTER);
            style.setFillForegroundColor(rgb(alt ? SLATE : new byte[]{(byte) 255, (byte) 255, (byte) 255}));
            style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            applyBorder(style);
            if (format != null) {
                style.setDataFormat(wb.createDataFormat().getFormat(format));
            }
            return style;
        }

        private static XSSFColor rgb(byte[] rgb) {
            return new XSSFColor(rgb, null);
        }

        private static void applyBorder(XSSFCellStyle style) {
            style.setBorderTop(BorderStyle.THIN);
            style.setBorderBottom(BorderStyle.THIN);
            style.setBorderLeft(BorderStyle.THIN);
            style.setBorderRight(BorderStyle.THIN);
            XSSFColor border = rgb(BORDER);
            style.setTopBorderColor(border);
            style.setBottomBorderColor(border);
            style.setLeftBorderColor(border);
            style.setRightBorderColor(border);
        }
    }
}
