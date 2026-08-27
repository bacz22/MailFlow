package com.mailflow.mail;

import com.mailflow.mail.service.impl.EmailService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "clientUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(emailService, "fromEmail", "no-reply@mailflow.dev");
        ReflectionTestUtils.setField(emailService, "fromName", "MailFlow Platform");
    }

    @Test
    @DisplayName("Gửi email thành công khi có cấu hình SMTP username")
    void sendVerificationEmail_success() {
        ReflectionTestUtils.setField(emailService, "smtpUsername", "smtp_user@gmail.com");
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));

        emailService.sendVerificationEmail("test@mailflow.dev", "Nguyen Van An", "raw_token_123");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Bật chế độ Fallback Dev Mode (log console) khi SMTP username để trống")
    void sendVerificationEmail_fallbackDevMode() {
        ReflectionTestUtils.setField(emailService, "smtpUsername", "");

        emailService.sendVerificationEmail("test@mailflow.dev", "Nguyen Van An", "raw_token_123");

        // Không gọi mailSender.send()
        verify(mailSender, never()).send(any(MimeMessage.class));
    }
}
