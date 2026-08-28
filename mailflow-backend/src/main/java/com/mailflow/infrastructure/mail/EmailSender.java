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
}
