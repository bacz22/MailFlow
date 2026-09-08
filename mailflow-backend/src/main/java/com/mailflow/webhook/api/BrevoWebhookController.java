package com.mailflow.webhook.api;

import com.mailflow.common.exception.AppException;
import com.mailflow.infrastructure.brevo.BrevoProperties;
import com.mailflow.webhook.application.BrevoWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public Brevo transactional/SMTP webhook receiver.
 * <p>
 * Configure in Brevo dashboard:<br>
 * {@code {APP_PUBLIC_API_URL}/webhooks/brevo/transactional?secret=YOUR_SECRET}<br>
 * or header {@code X-Mailflow-Webhook-Secret: YOUR_SECRET}.
 */
@Slf4j
@RestController
@RequestMapping("/webhooks/brevo")
@RequiredArgsConstructor
public class BrevoWebhookController {

    public static final String SECRET_HEADER = "X-Mailflow-Webhook-Secret";

    private final BrevoProperties brevoProperties;
    private final BrevoWebhookService webhookService;

    @PostMapping({"/transactional", "/smtp", ""})
    public ResponseEntity<Void> receive(
            @RequestBody(required = false) Object payload,
            @RequestHeader(value = SECRET_HEADER, required = false) String headerSecret,
            @RequestParam(value = "secret", required = false) String querySecret
    ) {
        assertSecret(headerSecret, querySecret);
        if (payload == null) {
            return ResponseEntity.ok().build();
        }
        try {
            webhookService.handlePayload(payload);
        } catch (Exception ex) {
            // Acknowledge to avoid Brevo retry storms on our bugs; log for ops
            log.error("Brevo webhook processing failed: {}", ex.getMessage(), ex);
        }
        return ResponseEntity.ok().build();
    }

    private void assertSecret(String headerSecret, String querySecret) {
        if (!brevoProperties.isWebhookConfigured()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "WEBHOOK_NOT_CONFIGURED",
                    "Chưa cấu hình mailflow.brevo.webhook-secret.");
        }
        String expected = brevoProperties.getWebhookSecret();
        String provided = StringUtils.hasText(headerSecret) ? headerSecret.trim()
                : (StringUtils.hasText(querySecret) ? querySecret.trim() : "");
        if (!expected.equals(provided)) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "WEBHOOK_UNAUTHORIZED",
                    "Webhook secret không hợp lệ.");
        }
    }
}
