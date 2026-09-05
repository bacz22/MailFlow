package com.mailflow.infrastructure.mail;

public interface EmailSender {

    /**
     * Gửi email xác thực tài khoản kèm liên kết và mã Token kích hoạt
     *
     * @param toEmail       Địa chỉ email người nhận
     * @param recipientName Tên đầy đủ của người nhận
     * @param rawToken      Chuỗi mã token xác thực chưa băm (raw token)
     */
    void sendVerificationEmail(String toEmail, String recipientName, String rawToken);

    /**
     * Gửi email đặt lại mật khẩu kèm liên kết khôi phục
     *
     * @param toEmail       Địa chỉ email người nhận
     * @param recipientName Tên đầy đủ của người nhận
     * @param rawToken      Chuỗi mã token đặt lại mật khẩu chưa băm (raw token)
     */
    void sendPasswordResetEmail(String toEmail, String recipientName, String rawToken);

    void sendWorkspaceInvitationEmail(String toEmail, String workspaceName, String rawToken, String role);

    /**
     * Gửi HTML tùy ý qua SMTP transactional (send-test mẫu email).
     * Ném lỗi nếu SMTP chưa cấu hình hoặc gửi thất bại.
     */
    void sendHtmlEmail(String toEmail, String subject, String htmlBody);

    /**
     * Gửi HTML với From hiển thị / Reply-To (campaign bulk / send-test).
     * {@code fromName}/{@code fromEmail} null → dùng cấu hình hệ thống.
     * Với SMTP Gmail, địa chỉ From thường vẫn là tài khoản SMTP; fromName + replyTo phản ánh người gửi campaign.
     */
    void sendHtmlEmail(
            String toEmail,
            String subject,
            String htmlBody,
            String fromName,
            String fromEmail,
            String replyTo
    );

    /**
     * @param useSenderAsFrom when true, send via ESP SMTP with From = fromEmail (requires ESP configured)
     */
    void sendHtmlEmail(
            String toEmail,
            String subject,
            String htmlBody,
            String fromName,
            String fromEmail,
            String replyTo,
            boolean useSenderAsFrom
    );
}
