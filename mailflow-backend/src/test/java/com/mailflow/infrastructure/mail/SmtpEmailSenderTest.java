package com.mailflow.infrastructure.mail;

import com.mailflow.infrastructure.mail.EspMailProperties;
import com.mailflow.infrastructure.mail.SmtpEmailSender;
import jakarta.mail.BodyPart;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SmtpEmailSenderTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private SmtpEmailSender emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "clientUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(emailService, "fromEmail", "no-reply@mailflow.dev");
        ReflectionTestUtils.setField(emailService, "fromName", "MailFlow Platform");
        EspMailProperties espProps = new EspMailProperties();
        ReflectionTestUtils.setField(emailService, "espMailProperties", espProps);
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
    @DisplayName("Bật chế độ Fallback Dev Mode khi SMTP username để trống")
    void sendVerificationEmail_fallbackDevMode() {
        ReflectionTestUtils.setField(emailService, "smtpUsername", "");

        emailService.sendVerificationEmail("test@mailflow.dev", "Nguyen Van An", "raw_token_123");

        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("HTML email escape tên và không gắn email vào query verify")
    void sendVerificationEmail_escapesHtmlAndOmitsEmailFromUrl() throws Exception {
        ReflectionTestUtils.setField(emailService, "smtpUsername", "smtp_user@gmail.com");
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));

        emailService.sendVerificationEmail(
                "test@mailflow.dev",
                "<img src=x onerror=alert(1)>",
                "raw_token_123"
        );

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());

        String html = extractHtml(captor.getValue());
        assertThat(html).doesNotContain("<img src=x");
        assertThat(html).contains("&lt;img src=x onerror=alert(1)&gt;");
        assertThat(html).contains("/verify-email?token=raw_token_123");
        assertThat(html).doesNotContain("&amp;email=");
        assertThat(html).doesNotContain("&email=");
    }

    @Test
    @DisplayName("URL xác thực chỉ chứa token đã encode, không chứa email")
    void buildVerificationUrl_containsEncodedTokenOnly() {
        String url = emailService.buildVerificationUrl("a+b/c");

        assertThat(url).isEqualTo("http://localhost:5173/verify-email?token=a%2Bb%2Fc");
        assertThat(url).doesNotContain("email=");
    }

    @Test
    @DisplayName("Gửi email đặt lại mật khẩu thành công khi có SMTP")
    void sendPasswordResetEmail_success() {
        ReflectionTestUtils.setField(emailService, "smtpUsername", "smtp_user@gmail.com");
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));

        emailService.sendPasswordResetEmail("test@mailflow.dev", "Nguyen Van An", "raw_token_123");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("URL đặt lại mật khẩu trỏ /reset-password?token= và không chứa email")
    void buildPasswordResetUrl_containsEncodedTokenOnly() {
        String url = emailService.buildPasswordResetUrl("a+b/c");

        assertThat(url).isEqualTo("http://localhost:5173/reset-password?token=a%2Bb%2Fc");
        assertThat(url).doesNotContain("email=");
    }

    @Test
    @DisplayName("HTML email đặt lại mật khẩu escape tên và dùng link /reset-password")
    void sendPasswordResetEmail_escapesHtmlAndUsesResetUrl() throws Exception {
        ReflectionTestUtils.setField(emailService, "smtpUsername", "smtp_user@gmail.com");
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));

        emailService.sendPasswordResetEmail(
                "test@mailflow.dev",
                "<img src=x onerror=alert(1)>",
                "raw_token_123"
        );

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());

        String html = extractHtml(captor.getValue());
        assertThat(html).doesNotContain("<img src=x");
        assertThat(html).contains("&lt;img src=x onerror=alert(1)&gt;");
        assertThat(html).contains("/reset-password?token=raw_token_123");
        assertThat(html).doesNotContain("&amp;email=");
        assertThat(html).doesNotContain("&email=");
    }

    private static String extractHtml(MimeMessage message) throws Exception {
        Object content = message.getContent();
        if (content instanceof String text) {
            return text;
        }
        if (content instanceof Multipart multipart) {
            StringBuilder html = new StringBuilder();
            collectHtml(multipart, html);
            return html.toString();
        }
        return String.valueOf(content);
    }

    private static void collectHtml(Multipart multipart, StringBuilder html) throws Exception {
        for (int i = 0; i < multipart.getCount(); i++) {
            BodyPart part = multipart.getBodyPart(i);
            Object partContent = part.getContent();
            if (partContent instanceof String text) {
                html.append(text);
            } else if (partContent instanceof Multipart nested) {
                collectHtml(nested, html);
            }
        }
    }
}
