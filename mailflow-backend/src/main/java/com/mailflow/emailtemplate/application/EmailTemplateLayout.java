package com.mailflow.emailtemplate.application;

import com.mailflow.emailtemplate.domain.model.EmailTemplate;

/**
 * Bọc nội dung HTML mẫu thành khung email (banner + CTA + footer) giống preview trên editor.
 * Dùng table + inline CSS vì Gmail không hiểu class Tailwind.
 */
public final class EmailTemplateLayout {

    private EmailTemplateLayout() {
    }

    public static String wrap(EmailTemplate template, String mergedBodyHtml) {
        String from = bannerFromColor(template.getThumbnailGradient());
        String to = bannerToColor(template.getThumbnailGradient());
        String label = EmailTemplateMerge.escape(template.getBannerLabel());
        String title = EmailTemplateMerge.escape(
                template.getBannerTitle() == null || template.getBannerTitle().isBlank()
                        ? "Bản Tin MailFlow"
                        : template.getBannerTitle()
        );
        String labelRow = label.isEmpty()
                ? ""
                : "<div style=\"font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:rgba(255,255,255,0.85);margin-bottom:6px;\">"
                  + label
                  + "</div>";
        String body = mergedBodyHtml == null ? "" : mergedBodyHtml;

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0;padding:24px;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
                <tr>
                  <td style="padding:28px 28px 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-radius:12px;overflow:hidden;background-color:"""
                + from
                + ";background:linear-gradient(135deg,"
                + from
                + ","
                + to
                + """
                );">
                      <tr>
                        <td style="padding:28px 24px;text-align:center;color:#ffffff;">
            """
                + labelRow
                + """
                          <div style="font-size:22px;font-weight:800;letter-spacing:-0.4px;line-height:1.25;">"""
                + title
                + """
            </div>
                        </td>
                      </tr>
                    </table>
                    <div style="padding:24px 4px 8px;font-size:14px;line-height:1.65;color:#334155;">
            """
                + body
                + """
                    </div>
                    <div style="text-align:center;padding:16px 0 8px;">
                      <a href="#" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">Truy Cập Nền Tảng</a>
                    </div>
                    <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;line-height:1.6;">
                      <div style="color:#059669;font-weight:600;margin-bottom:6px;">Chuẩn bảo mật xác thực DKIM &amp; RFC 8058 1-Click Unsubscribe</div>
                      <div>© 2026 MailFlow Inc. Tất cả quyền được bảo lưu.</div>
                      <div>Bạn nhận được email này theo yêu cầu nhận tin. <a href="#" style="color:#2563eb;">Hủy đăng ký</a></div>
                    </div>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
    }

    static String bannerFromColor(String gradientClass) {
        if (gradientClass == null) {
            return "#2563eb";
        }
        if (gradientClass.contains("emerald")) {
            return "#059669";
        }
        if (gradientClass.contains("amber")) {
            return "#d97706";
        }
        if (gradientClass.contains("violet") || gradientClass.contains("purple")) {
            return "#7c3aed";
        }
        if (gradientClass.contains("sky") || gradientClass.contains("cyan")) {
            return "#0284c7";
        }
        if (gradientClass.contains("slate")) {
            return "#334155";
        }
        return "#2563eb";
    }

    static String bannerToColor(String gradientClass) {
        if (gradientClass == null) {
            return "#4f46e5";
        }
        if (gradientClass.contains("teal")) {
            return "#0d9488";
        }
        if (gradientClass.contains("rose")) {
            return "#e11d48";
        }
        if (gradientClass.contains("purple")) {
            return "#9333ea";
        }
        if (gradientClass.contains("cyan")) {
            return "#06b6d4";
        }
        if (gradientClass.contains("slate")) {
            return "#0f172a";
        }
        return "#4f46e5";
    }
}
