package com.mailflow.campaign.application;

import com.mailflow.campaign.domain.model.Campaign;
import com.mailflow.campaign.domain.model.CampaignRecipient;
import com.mailflow.campaign.domain.model.CampaignRecipientStatus;
import com.mailflow.campaign.domain.model.CampaignStatus;
import com.mailflow.campaign.domain.repository.CampaignRecipientRepository;
import com.mailflow.campaign.domain.repository.CampaignRepository;
import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.contact.domain.model.Contact;
import com.mailflow.contact.domain.repository.ContactRepository;
import com.mailflow.emailsender.domain.model.EmailSenderIdentity;
import com.mailflow.emailsender.domain.repository.EmailSenderIdentityRepository;
import com.mailflow.emailtemplate.application.EmailTemplateLayout;
import com.mailflow.emailtemplate.application.EmailTemplateMerge;
import com.mailflow.emailtemplate.domain.model.EmailTemplate;
import com.mailflow.emailtemplate.domain.repository.EmailTemplateRepository;
import com.mailflow.engagement.application.HtmlTrackingInjector;
import com.mailflow.engagement.application.PublicTrackingUrls;
import com.mailflow.infrastructure.mail.CampaignMailHeaders;
import com.mailflow.infrastructure.mail.CampaignMailRouter;
import com.mailflow.infrastructure.mail.ListUnsubscribeHeaders;
import com.mailflow.quota.application.QuotaService;
import com.mailflow.workspace.domain.model.Workspace;
import com.mailflow.workspace.domain.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Per-recipient + finalize transactions so SMTP side-effects commit with SENT/sent_count
 * (avoids UI stuck on SENDING with sentCount=0 until a whole batch finishes).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CampaignSendProcessor {

    private final CampaignRepository campaignRepository;
    private final CampaignRecipientRepository recipientRepository;
    private final ContactRepository contactRepository;
    private final EmailTemplateRepository templateRepository;
    private final EmailSenderIdentityRepository senderRepository;
    private final CampaignMailRouter campaignMailRouter;
    private final QuotaService quotaService;
    private final WorkspaceRepository workspaceRepository;
    private final PublicTrackingUrls trackingUrls;
    private final HtmlTrackingInjector trackingInjector;

    @Transactional(readOnly = true)
    public List<UUID> findPendingRecipientIds(int batchSize) {
        return recipientRepository.findPendingForSendingCampaigns(PageRequest.of(0, Math.max(1, batchSize)))
                .stream()
                .map(CampaignRecipient::getId)
                .toList();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processOne(UUID recipientId) {
        CampaignRecipient recipient = recipientRepository.findById(recipientId)
                .orElse(null);
        if (recipient == null || recipient.getStatus() != CampaignRecipientStatus.PENDING) {
            return;
        }
        Campaign campaign = campaignRepository.findById(recipient.getCampaignId()).orElse(null);
        if (campaign == null || campaign.getStatus() != CampaignStatus.SENDING) {
            return;
        }

        recipient.setStatus(CampaignRecipientStatus.SENDING);
        recipient.setAttempts(recipient.getAttempts() + 1);
        recipientRepository.saveAndFlush(recipient);

        try {
            Contact contact = contactRepository
                    .findByWorkspaceIdAndIdIn(campaign.getWorkspaceId(), List.of(recipient.getContactId()))
                    .stream()
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Contact", recipient.getContactId().toString()));
            // Atomic reserve before SMTP — tránh overshoot concurrent; nếu hết hạn mức thì pause
            quotaService.consumeSendSlot(campaign.getWorkspaceId(), 1);
            boolean reserved = true;
            try {
                String messageId = sendCampaignEmail(campaign, contact, recipient);
                reserved = false;
                recipient.setStatus(CampaignRecipientStatus.SENT);
                recipient.setSentAt(Instant.now());
                recipient.setError(null);
                if (messageId != null && !messageId.isBlank()) {
                    recipient.setProviderMessageId(trimMessageId(messageId));
                }
                recipientRepository.saveAndFlush(recipient);
                campaign.setSentCount(campaign.getSentCount() + 1);
                campaignRepository.saveAndFlush(campaign);
            } catch (Exception sendEx) {
                if (reserved) {
                    quotaService.releaseSendSlot(campaign.getWorkspaceId(), 1);
                }
                throw sendEx;
            }
        } catch (Exception ex) {
            if (ex instanceof AppException appEx && "QUOTA_EXCEEDED".equals(appEx.getCode())) {
                recipient.setStatus(CampaignRecipientStatus.PENDING);
                recipient.setError(null);
                recipientRepository.saveAndFlush(recipient);
                campaign.setStatus(CampaignStatus.PAUSED);
                campaignRepository.saveAndFlush(campaign);
                log.warn("Campaign [{}] tạm dừng do hết hạn mức gửi demo: {}",
                        campaign.getId(), appEx.getMessage());
                return;
            }
            String message = ex.getMessage() == null ? "SMTP_SEND_FAILED" : ex.getMessage();
            if (message.length() > 1000) {
                message = message.substring(0, 1000);
            }
            recipient.setStatus(CampaignRecipientStatus.FAILED);
            recipient.setError(message);
            recipientRepository.saveAndFlush(recipient);
            log.warn("Gửi recipient [{}] campaign [{}] thất bại (đã hoàn quota): {}",
                    recipient.getId(), campaign.getId(), message);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recoverStuckSendingRecipients() {
        // Claimed SENDING but TX died before SENT/FAILED — put back to PENDING
        List<CampaignRecipient> stuck = recipientRepository.findByStatus(CampaignRecipientStatus.SENDING);
        for (CampaignRecipient recipient : stuck) {
            recipient.setStatus(CampaignRecipientStatus.PENDING);
            recipientRepository.save(recipient);
            log.warn("Recover stuck recipient [{}] back to PENDING", recipient.getId());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finalizeSendingCampaigns() {
        for (Campaign campaign : campaignRepository.findByStatus(CampaignStatus.SENDING)) {
            long pending = recipientRepository.countByCampaignIdAndStatus(
                    campaign.getId(), CampaignRecipientStatus.PENDING);
            long sending = recipientRepository.countByCampaignIdAndStatus(
                    campaign.getId(), CampaignRecipientStatus.SENDING);
            if (pending > 0 || sending > 0) {
                continue;
            }
            long total = recipientRepository.countByCampaignId(campaign.getId());
            long sent = recipientRepository.countByCampaignIdAndStatus(
                    campaign.getId(), CampaignRecipientStatus.SENT);
            campaign.setSentCount(sent);
            campaign.setCompletedAt(Instant.now());
            if (total == 0 || sent == 0) {
                campaign.setStatus(CampaignStatus.FAILED);
            } else {
                campaign.setStatus(CampaignStatus.COMPLETED);
            }
            campaignRepository.save(campaign);
            log.info("Campaign [{}] finalized as {}", campaign.getId(), campaign.getStatus());
        }
    }

    private String sendCampaignEmail(Campaign campaign, Contact contact, CampaignRecipient recipient) {
        if (contact == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CONTACT_MISSING",
                    "Không tìm thấy liên hệ người nhận.");
        }
        Workspace workspace = workspaceRepository.findById(campaign.getWorkspaceId()).orElse(null);
        boolean openTracking = workspace == null || workspace.isEnableOpenTracking();
        boolean clickTracking = workspace == null || workspace.isEnableClickTracking();
        boolean enforceRfc = workspace == null || workspace.isEnforceRfc8058();

        String unsubscribeUrl = trackingUrls.unsubscribeUrl(
                campaign.getWorkspaceId(), campaign.getId(), contact.getId());
        String subject = EmailTemplateMerge.applySubject(
                campaign.getSubject(),
                contact.getFirstName(),
                contact.getLastName(),
                contact.getEmail(),
                contact.getCompany()
        );
        String body = EmailTemplateMerge.applyHtml(
                campaign.getHtmlContent(),
                contact.getFirstName(),
                contact.getLastName(),
                contact.getEmail(),
                contact.getCompany(),
                contact.getPhone(),
                unsubscribeUrl
        );
        EmailTemplate template = campaign.getTemplateId() == null
                ? null
                : templateRepository.findByIdAndWorkspaceId(campaign.getTemplateId(), campaign.getWorkspaceId())
                        .orElse(null);
        String wrapped = template != null
                ? EmailTemplateLayout.wrap(template, body, unsubscribeUrl)
                : EmailTemplateLayout.wrap(
                        EmailTemplate.DEFAULT_THUMBNAIL,
                        "Chiến dịch",
                        campaign.getName(),
                        body,
                        unsubscribeUrl
                );
        wrapped = trackingInjector.inject(
                wrapped,
                campaign.getWorkspaceId(),
                campaign.getId(),
                contact.getId(),
                openTracking,
                clickTracking
        );
        String openUrl = trackingUrls.openPixelUrl(
                campaign.getWorkspaceId(), campaign.getId(), contact.getId());
        String clickUrl = trackingUrls.clickRedirectUrl(
                campaign.getWorkspaceId(), campaign.getId(), contact.getId(), "https://example.com");
        log.info(
                "Campaign mail tracking campaign={} contact={} open={} click={} rfc={} unsub={} openPixel={} clickSample={} hasPixel={}",
                campaign.getId(),
                contact.getId(),
                openTracking,
                clickTracking,
                enforceRfc,
                unsubscribeUrl,
                openUrl,
                clickUrl,
                wrapped.contains("/t/o/")
        );
        EmailSenderIdentity sender = campaign.getSenderId() == null
                ? null
                : senderRepository.findByIdAndWorkspaceId(campaign.getSenderId(), campaign.getWorkspaceId())
                        .orElse(null);
        ListUnsubscribeHeaders listUnsub = null;
        if (enforceRfc) {
            listUnsub = new ListUnsubscribeHeaders(
                    unsubscribeUrl,
                    trackingUrls.unsubscribeOneClickUrl(
                            campaign.getWorkspaceId(), campaign.getId(), contact.getId())
            );
        }
        CampaignMailHeaders headers = CampaignMailHeaders.of(
                listUnsub, recipient.getId(), campaign.getWorkspaceId());
        return campaignMailRouter.sendHtml(
                contact.getEmail(), subject, wrapped, sender, campaign.getReplyTo(), headers);
    }

    private static String trimMessageId(String messageId) {
        String id = messageId.trim();
        if (id.length() > 320) {
            return id.substring(0, 320);
        }
        return id;
    }
}
