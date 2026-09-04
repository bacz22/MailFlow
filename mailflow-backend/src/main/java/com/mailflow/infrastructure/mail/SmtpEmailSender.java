package com.mailflow.infrastructure.mail;

import com.mailflow.common.exception.AppException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class SmtpEmailSender implements EmailSender {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${mailflow.app.client-url:http://localhost:5173}")
    private String clientUrl;

    @Value("${mailflow.mail.from-email:no-reply@mailflow.dev}")
    private String fromEmail;

    @Value("${mailflow.mail.from-name:MailFlow Platform}")
    private String fromName;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Override
    public void sendVerificationEmail(String toEmail, String recipientName, String rawToken) {
        String verificationUrl = buildVerificationUrl(rawToken);

        log.info("Chuẩn bị gửi email xác thực tới [{}]", toEmail);

        if (mailSender == null || smtpUsername == null || smtpUsername.isBlank()) {
            log.warn(
                    "Chưa cấu hình SMTP. Email xác thực tới [{}] không được gửi qua Internet. " +
                    "Dùng chức năng gửi lại mã xác thực sau khi SMTP đã sẵn sàng.",
                    toEmail
            );
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("MailFlow - Kích hoạt tài khoản của bạn");

            String htmlContent = buildVerificationEmailHtml(recipientName, verificationUrl, rawToken);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Đã gửi thành công email xác thực tài khoản tới [{}]", toEmail);

        } catch (MessagingException | UnsupportedEncodingException | MailException e) {
            log.error(
                    "Không thể gửi email qua máy chủ SMTP tới [{}]: {}. " +
                    "Người dùng có thể dùng chức năng gửi lại mã xác thực.",
                    toEmail,
                    e.getMessage(),
                    e
            );
        }
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String recipientName, String rawToken) {
        String resetUrl = buildPasswordResetUrl(rawToken);

        log.info("Chuẩn bị gửi email đặt lại mật khẩu tới [{}]", toEmail);

        if (mailSender == null || smtpUsername == null || smtpUsername.isBlank()) {
            log.warn(
                    "Chưa cấu hình SMTP. Email đặt lại mật khẩu tới [{}] không được gửi qua Internet. " +
                    "Dùng chức năng gửi lại liên kết sau khi SMTP đã sẵn sàng.",
                    toEmail
            );
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("MailFlow - Đặt lại mật khẩu");

            String htmlContent = buildPasswordResetEmailHtml(recipientName, resetUrl, rawToken);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Đã gửi thành công email đặt lại mật khẩu tới [{}]", toEmail);

        } catch (MessagingException | UnsupportedEncodingException | MailException e) {
            log.error(
                    "Không thể gửi email đặt lại mật khẩu qua máy chủ SMTP tới [{}]: {}. " +
                    "Người dùng có thể dùng chức năng gửi lại liên kết.",
                    toEmail,
                    e.getMessage(),
                    e
            );
        }
    }

    @Override
    public void sendWorkspaceInvitationEmail(String toEmail, String workspaceName, String rawToken, String role) {
        String inviteUrl = buildWorkspaceInvitationUrl(rawToken);
        log.info("Chuẩn bị gửi thư mời workspace tới [{}]", toEmail);
        if (mailSender == null || smtpUsername == null || smtpUsername.isBlank()) {
            log.warn("Chưa cấu hình SMTP. Thư mời workspace tới [{}] không được gửi qua Internet.", toEmail);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());
            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("MailFlow - Lời mời tham gia workspace");
            helper.setText(buildInvitationEmailHtml(workspaceName, inviteUrl, rawToken, role), true);
            mailSender.send(message);
            log.info("Đã gửi thư mời workspace tới [{}]", toEmail);
        } catch (MessagingException | UnsupportedEncodingException | MailException e) {
            log.error("Không thể gửi thư mời workspace tới [{}]: {}", toEmail, e.getMessage(), e);
        }
    }

    @Override
    public void sendHtmlEmail(String toEmail, String subject, String htmlBody) {
        sendHtmlEmail(toEmail, subject, htmlBody, null, null, null);
    }

    @Override
    public void sendHtmlEmail(
            String toEmail,
            String subject,
            String htmlBody,
            String fromNameOverride,
            String fromEmailOverride,
            String replyTo
    ) {
        log.info("Chuẩn bị gửi HTML tới [{}]", toEmail);
        if (mailSender == null || smtpUsername == null || smtpUsername.isBlank()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "SMTP_NOT_CONFIGURED",
                    "Chưa cấu hình SMTP. Không thể gửi email thử nghiệm.");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());
            String displayName = (fromNameOverride != null && !fromNameOverride.isBlank())
                    ? fromNameOverride.trim()
                    : fromName;
            // Gmail SMTP chỉ cho phép From = tài khoản đăng nhập; giữ fromEmail hệ thống, đổi display name.
            helper.setFrom(fromEmail, displayName);
            helper.setTo(toEmail);
            String effectiveReplyTo = firstNonBlank(replyTo, fromEmailOverride);
            if (effectiveReplyTo != null) {
                helper.setReplyTo(effectiveReplyTo);
            }
            helper.setSubject(subject == null ? "" : subject);
            helper.setText(htmlBody == null ? "" : htmlBody, true);
            mailSender.send(message);
            log.info("Đã gửi HTML tới [{}] as [{}] reply-to [{}]", toEmail, displayName, effectiveReplyTo);
        } catch (MessagingException | UnsupportedEncodingException | MailException e) {
            log.error("Không thể gửi HTML tới [{}]: {}", toEmail, e.getMessage(), e);
            throw new AppException(HttpStatus.BAD_GATEWAY, "SMTP_SEND_FAILED",
                    "Không gửi được email: " + e.getMessage());
        }
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a.trim();
        }
        if (b != null && !b.isBlank()) {
            return b.trim();
        }
        return null;
    }

    public String buildVerificationUrl(String rawToken) {
        return clientBaseUrl() + "/verify-email?token=" + encodeToken(rawToken);
    }

    public String buildPasswordResetUrl(String rawToken) {
        return clientBaseUrl() + "/reset-password?token=" + encodeToken(rawToken);
    }

    public String buildWorkspaceInvitationUrl(String rawToken) {
        return clientBaseUrl() + "/dashboard?invite=" + encodeToken(rawToken);
    }

    private String clientBaseUrl() {
        String base = clientUrl == null ? "" : clientUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base;
    }

    private static String encodeToken(String rawToken) {
        return URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
    }

    private String buildVerificationEmailHtml(String recipientName, String verificationUrl, String rawToken) {
        String name = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "bạn";
        String safeName = HtmlUtils.htmlEscape(name);
        String safeUrl = HtmlUtils.htmlEscape(verificationUrl);
        String safeToken = HtmlUtils.htmlEscape(rawToken);

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Xác thực tài khoản MailFlow</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .container { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 24px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
                .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
                .body { padding: 32px 28px; }
                .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
                .text { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
                .cta-wrapper { text-align: center; margin: 28px 0; }
                .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-size: 14px; font-weight: 700; padding: 12px 32px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
                .token-box { background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; margin: 20px 0; text-align: center; }
                .token-label { font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 6px; }
                .token-code { font-family: monospace; font-size: 15px; font-weight: 700; color: #1e293b; letter-spacing: 1px; word-break: break-all; }
                .note { font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
                .footer { background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>MailFlow</h1>
                  <p>Enterprise Email Automation Platform</p>
                </div>
                <div class="body">
                  <div class="greeting">Xin chào %s,</div>
                  <p class="text">
                    Cảm ơn bạn đã đăng ký tài khoản tại <strong>MailFlow</strong>. Vui lòng bấm vào nút bên dưới để hoàn tất xác thực và kích hoạt không gian làm việc của bạn:
                  </p>
                  <div class="cta-wrapper">
                    <a href="%s" target="_blank" class="btn">Kích Hoạt Tài Khoản Ngay &rarr;</a>
                  </div>
                  <div class="token-box">
                    <div class="token-label">Hoặc nhập mã Token xác thực trực tiếp trên trình duyệt:</div>
                    <div class="token-code">%s</div>
                  </div>
                  <p class="note">
                    * Lưu ý: Liên kết và mã xác thực trên chỉ có hiệu lực trong vòng <strong>24 giờ</strong>.<br>
                    Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ kỹ thuật.
                  </p>
                </div>
                <div class="footer">
                  &copy; 2026 MailFlow Inc. All rights reserved. &bull; ISO 27001 & RFC 8058 Certified
                </div>
              </div>
            </body>
            </html>
            """.formatted(safeName, safeUrl, safeToken);
    }

    private String buildPasswordResetEmailHtml(String recipientName, String resetUrl, String rawToken) {
        String name = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "bạn";
        String safeName = HtmlUtils.htmlEscape(name);
        String safeUrl = HtmlUtils.htmlEscape(resetUrl);
        String safeToken = HtmlUtils.htmlEscape(rawToken);

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Đặt lại mật khẩu MailFlow</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .container { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 24px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
                .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
                .body { padding: 32px 28px; }
                .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
                .text { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
                .cta-wrapper { text-align: center; margin: 28px 0; }
                .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-size: 14px; font-weight: 700; padding: 12px 32px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
                .token-box { background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; margin: 20px 0; text-align: center; }
                .token-label { font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 6px; }
                .token-code { font-family: monospace; font-size: 15px; font-weight: 700; color: #1e293b; letter-spacing: 1px; word-break: break-all; }
                .note { font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
                .footer { background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>MailFlow</h1>
                  <p>Enterprise Email Automation Platform</p>
                </div>
                <div class="body">
                  <div class="greeting">Xin chào %s,</div>
                  <p class="text">
                    Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>MailFlow</strong> của bạn.
                    Vui lòng bấm vào nút bên dưới để tạo mật khẩu mới:
                  </p>
                  <div class="cta-wrapper">
                    <a href="%s" target="_blank" class="btn">Đặt Lại Mật Khẩu &rarr;</a>
                  </div>
                  <div class="token-box">
                    <div class="token-label">Hoặc dán liên kết này vào trình duyệt nếu nút không hoạt động:</div>
                    <div class="token-code">%s</div>
                  </div>
                  <p class="note">
                    * Lưu ý: Liên kết đặt lại mật khẩu chỉ có hiệu lực trong vòng <strong>1 giờ</strong>.<br>
                    Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                  </p>
                </div>
                <div class="footer">
                  &copy; 2026 MailFlow Inc. All rights reserved. &bull; ISO 27001 & RFC 8058 Certified
                </div>
              </div>
            </body>
            </html>
            """.formatted(safeName, safeUrl, safeToken);
    }

    private String buildInvitationEmailHtml(String workspaceName, String inviteUrl, String rawToken, String role) {
        String safeName = HtmlUtils.htmlEscape(workspaceName == null || workspaceName.isBlank() ? "workspace" : workspaceName.trim());
        String safeUrl = HtmlUtils.htmlEscape(inviteUrl);
        String safeToken = HtmlUtils.htmlEscape(rawToken);
        String safeRole = HtmlUtils.htmlEscape(role == null ? "" : role);
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <body style="font-family: sans-serif; background:#f8fafc; padding:24px; color:#1e293b;">
              <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;">
                <h1 style="color:#2563eb;">MailFlow</h1>
                <p>Bạn được mời tham gia workspace <strong>%s</strong> với vai trò <strong>%s</strong>.</p>
                <p><a href="%s" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Chấp nhận lời mời</a></p>
                <p style="font-size:12px;color:#64748b;">Hoặc dán mã này sau khi đăng nhập:</p>
                <p style="font-family:monospace;word-break:break-all;">%s</p>
                <p style="font-size:12px;color:#94a3b8;">Lời mời có hiệu lực 7 ngày.</p>
              </div>
            </body>
            </html>
            """.formatted(safeName, safeRole, safeUrl, safeToken);
    }
}
