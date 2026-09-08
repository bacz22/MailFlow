package com.mailflow.infrastructure.mail;

import com.mailflow.common.exception.AppException;
import com.mailflow.emailsender.domain.model.EmailSenderIdentity;
import com.mailflow.sendingdomain.domain.model.SendingDomain;
import com.mailflow.sendingdomain.domain.model.SendingDomainStatus;
import com.mailflow.sendingdomain.domain.repository.SendingDomainRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Resolves campaign/send-test From identity: verified domain → ESP From=sender; else system SMTP fallback.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CampaignMailRouter {

    private final EmailSender emailSender;
    private final SendingDomainRepository domainRepository;
    private final EspMailProperties espMailProperties;

    public record ResolvedFrom(
            String fromName,
            String fromEmail,
            String replyTo,
            boolean useSenderAsFrom
    ) {}

    public ResolvedFrom resolve(EmailSenderIdentity sender, String campaignReplyTo) {
        String fromName = sender != null ? sender.getName() : null;
        String fromEmail = sender != null ? sender.getEmail() : null;
        String replyTo = firstNonBlank(campaignReplyTo, fromEmail);

        if (sender == null || sender.getDomainId() == null) {
            log.warn("Campaign mail: no sender domain — using system From + display name");
            return new ResolvedFrom(fromName, fromEmail, replyTo, false);
        }

        SendingDomain domain = domainRepository.findById(sender.getDomainId()).orElse(null);
        if (domain == null || domain.getStatus() != SendingDomainStatus.VERIFIED) {
            log.warn("Campaign mail: sender [{}] domain not VERIFIED — system From fallback",
                    sender.getEmail());
            return new ResolvedFrom(fromName, fromEmail, replyTo, false);
        }

        if (!espMailProperties.isConfigured()) {
            log.warn("Campaign mail: domain VERIFIED but ESP SMTP not configured — system From fallback");
            return new ResolvedFrom(fromName, fromEmail, replyTo, false);
        }

        return new ResolvedFrom(fromName, fromEmail, replyTo, true);
    }

    public void sendHtml(
            String toEmail,
            String subject,
            String htmlBody,
            EmailSenderIdentity sender,
            String campaignReplyTo
    ) {
        sendHtml(toEmail, subject, htmlBody, sender, campaignReplyTo, (CampaignMailHeaders) null);
    }

    public void sendHtml(
            String toEmail,
            String subject,
            String htmlBody,
            EmailSenderIdentity sender,
            String campaignReplyTo,
            ListUnsubscribeHeaders listUnsubscribe
    ) {
        sendHtml(
                toEmail,
                subject,
                htmlBody,
                sender,
                campaignReplyTo,
                listUnsubscribe == null ? null : CampaignMailHeaders.of(listUnsubscribe, null, null)
        );
    }

    /**
     * @return SMTP Message-ID when available
     */
    public String sendHtml(
            String toEmail,
            String subject,
            String htmlBody,
            EmailSenderIdentity sender,
            String campaignReplyTo,
            CampaignMailHeaders headers
    ) {
        ResolvedFrom from = resolve(sender, campaignReplyTo);
        return emailSender.sendHtmlEmail(
                toEmail,
                subject,
                htmlBody,
                from.fromName(),
                from.fromEmail(),
                from.replyTo(),
                from.useSenderAsFrom(),
                headers
        );
    }

    /**
     * Approve/send gate: sender must be linked to a VERIFIED sending domain.
     */
    public void requireVerifiedSendingDomain(UUID workspaceId, EmailSenderIdentity sender) {
        if (sender == null || sender.getDomainId() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CAMPAIGN_DOMAIN_REQUIRED",
                    "Người gửi chưa gắn tên miền đã xác thực. Vào Domains để thêm/verify DNS trước khi gửi.");
        }
        SendingDomain domain = domainRepository.findByIdAndWorkspaceId(sender.getDomainId(), workspaceId)
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "CAMPAIGN_DOMAIN_REQUIRED",
                        "Tên miền gắn với người gửi không tồn tại trong workspace."));
        if (domain.getStatus() != SendingDomainStatus.VERIFIED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CAMPAIGN_DOMAIN_REQUIRED",
                    "Tên miền @" + domain.getDomain()
                            + " chưa VERIFIED. Không thể gửi với From riêng cho đến khi DNS khớp.");
        }
        if (!espMailProperties.isConfigured()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "ESP_SMTP_NOT_CONFIGURED",
                    "Chưa cấu hình ESP SMTP (ESP_SMTP_HOST/USERNAME/PASSWORD). "
                            + "Cần ESP đã verify cùng domain để gửi From = địa chỉ người gửi.");
        }
    }

    public boolean isEspConfigured() {
        return espMailProperties.isConfigured();
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
}
