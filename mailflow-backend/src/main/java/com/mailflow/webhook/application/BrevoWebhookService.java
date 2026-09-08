package com.mailflow.webhook.application;

import com.mailflow.campaign.domain.model.CampaignRecipient;
import com.mailflow.campaign.domain.model.CampaignRecipientStatus;
import com.mailflow.campaign.domain.repository.CampaignRecipientRepository;
import com.mailflow.contact.domain.model.Contact;
import com.mailflow.contact.domain.model.ContactStatus;
import com.mailflow.contact.domain.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BrevoWebhookService {

    private final CampaignRecipientRepository recipientRepository;
    private final ContactRepository contactRepository;

    @Transactional
    public void handlePayload(Object payload) {
        if (payload instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    handleEvent(toStringKeyedMap(map));
                }
            }
            return;
        }
        if (payload instanceof Map<?, ?> map) {
            handleEvent(toStringKeyedMap(map));
        }
    }

    private void handleEvent(Map<String, Object> event) {
        String eventType = stringVal(event, "event");
        if (eventType == null || eventType.isBlank()) {
            log.debug("Brevo webhook skipped: missing event");
            return;
        }
        String normalized = eventType.trim().toLowerCase(Locale.ROOT);
        boolean hard = "hard_bounce".equals(normalized) || "blocked".equals(normalized);
        boolean soft = "soft_bounce".equals(normalized);
        if (!hard && !soft) {
            log.debug("Brevo webhook ignored event={}", normalized);
            return;
        }

        Optional<CampaignRecipient> matched = resolveRecipient(event);
        if (matched.isEmpty()) {
            log.warn("Brevo webhook bounce unmatched email={} tag={} messageId={}",
                    stringVal(event, "email"), stringVal(event, "tag"), stringVal(event, "message-id"));
            return;
        }

        CampaignRecipient recipient = matched.get();
        if (recipient.getStatus() == CampaignRecipientStatus.BOUNCED) {
            return;
        }

        String messageId = stringVal(event, "message-id");
        if (messageId != null && !messageId.isBlank()
                && (recipient.getProviderMessageId() == null || recipient.getProviderMessageId().isBlank())) {
            recipient.setProviderMessageId(trimTo(messageId, 320));
        }

        String reason = stringVal(event, "reason");
        String error = soft ? "soft_bounce" : normalized;
        if (reason != null && !reason.isBlank()) {
            error = error + ": " + reason;
        }
        recipient.setStatus(CampaignRecipientStatus.BOUNCED);
        recipient.setError(trimTo(error, 1000));
        recipientRepository.save(recipient);

        if (hard) {
            contactRepository.findByIdAndWorkspaceId(recipient.getContactId(), recipient.getWorkspaceId())
                    .ifPresent(this::markContactBounced);
        }

        log.info("Brevo bounce applied recipient={} hard={} event={}",
                recipient.getId(), hard, normalized);
    }

    private void markContactBounced(Contact contact) {
        if (contact.getStatus() == ContactStatus.BOUNCED) {
            return;
        }
        // Do not override UNSUBSCRIBED with BOUNCED
        if (contact.getStatus() == ContactStatus.UNSUBSCRIBED) {
            return;
        }
        contact.setStatus(ContactStatus.BOUNCED);
        contactRepository.save(contact);
    }

    private Optional<CampaignRecipient> resolveRecipient(Map<String, Object> event) {
        UUID fromTag = parseRecipientIdFromTag(stringVal(event, "tag"));
        if (fromTag == null) {
            fromTag = parseUuid(stringVal(event, "X-Mailflow-Recipient-Id"));
        }
        if (fromTag == null) {
            Object headers = event.get("headers");
            if (headers instanceof Map<?, ?> headerMap) {
                fromTag = parseUuid(stringVal(toStringKeyedMap(headerMap), "X-Mailflow-Recipient-Id"));
            }
        }
        if (fromTag != null) {
            return recipientRepository.findById(fromTag);
        }

        String messageId = stringVal(event, "message-id");
        if (messageId != null && !messageId.isBlank()) {
            Optional<CampaignRecipient> byMsg = recipientRepository.findByProviderMessageId(messageId.trim());
            if (byMsg.isPresent()) {
                return byMsg;
            }
            // Message-ID sometimes stored with/without angle brackets
            String alt = stripAngles(messageId.trim());
            if (!alt.equals(messageId.trim())) {
                byMsg = recipientRepository.findByProviderMessageId(alt);
                if (byMsg.isPresent()) {
                    return byMsg;
                }
                byMsg = recipientRepository.findByProviderMessageId("<" + alt + ">");
                if (byMsg.isPresent()) {
                    return byMsg;
                }
            }
        }

        String email = stringVal(event, "email");
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        UUID workspaceId = parseUuid(stringVal(event, "X-Mailflow-Workspace-Id"));
        List<CampaignRecipient> candidates;
        if (workspaceId != null) {
            candidates = recipientRepository.findLatestSentByWorkspaceAndEmail(
                    workspaceId, normalizedEmail, PageRequest.of(0, 1));
        } else {
            candidates = recipientRepository.findLatestSentByEmail(normalizedEmail, PageRequest.of(0, 1));
        }
        return candidates.isEmpty() ? Optional.empty() : Optional.of(candidates.getFirst());
    }

    static UUID parseRecipientIdFromTag(String tag) {
        if (tag == null || tag.isBlank()) {
            return null;
        }
        String t = tag.trim();
        String prefix = "mailflow-recipient:";
        if (t.toLowerCase(Locale.ROOT).startsWith(prefix)) {
            return parseUuid(t.substring(prefix.length()));
        }
        return parseUuid(t);
    }

    private static UUID parseUuid(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static String stringVal(Map<String, Object> map, String key) {
        Object v = map.get(key);
        if (v == null) {
            return null;
        }
        return String.valueOf(v);
    }

    private static Map<String, Object> toStringKeyedMap(Map<?, ?> map) {
        java.util.LinkedHashMap<String, Object> out = new java.util.LinkedHashMap<>();
        for (Map.Entry<?, ?> e : map.entrySet()) {
            if (e.getKey() != null) {
                out.put(String.valueOf(e.getKey()), e.getValue());
            }
        }
        return out;
    }

    private static String stripAngles(String id) {
        if (id.startsWith("<") && id.endsWith(">") && id.length() > 2) {
            return id.substring(1, id.length() - 1);
        }
        return id;
    }

    private static String trimTo(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
