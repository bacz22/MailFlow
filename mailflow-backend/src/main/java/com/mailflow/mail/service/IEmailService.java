package com.mailflow.mail.service;

public interface IEmailService {

    /**
     * Gửi email xác thực tài khoản kèm liên kết và mã Token kích hoạt
     *
     * @param toEmail       Địa chỉ email người nhận
     * @param recipientName Tên đầy đủ của người nhận
     * @param rawToken      Chuỗi mã token xác thực chưa băm (raw token)
     */
    void sendVerificationEmail(String toEmail, String recipientName, String rawToken);
}
