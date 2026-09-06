package com.mailflow.engagement.application;

import com.mailflow.contact.domain.model.Contact;
import com.mailflow.contact.domain.model.ContactStatus;
import com.mailflow.contact.domain.repository.ContactRepository;
import com.mailflow.engagement.domain.model.EmailEngagementEvent;
import com.mailflow.engagement.domain.model.EngagementEventType;
import com.mailflow.engagement.domain.repository.EmailEngagementEventRepository;
import com.mailflow.workspace.domain.model.Workspace;
import com.mailflow.workspace.domain.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EngagementService {

    private final ContactRepository contactRepository;
    private final WorkspaceRepository workspaceRepository;
    private final EmailEngagementEventRepository eventRepository;
    private final EngagementTokenService tokenService;

    @Transactional
    public boolean unsubscribe(String token) {
        EngagementTokenService.TokenPayload payload =
                tokenService.verify(token, EngagementTokenService.Purpose.UNSUB);
        Contact contact = contactRepository.findById(payload.contactId()).orElse(null);
        if (contact == null
                || !contact.getWorkspaceId().equals(payload.workspaceId())) {
            return false;
        }
        if (contact.getStatus() != ContactStatus.UNSUBSCRIBED) {
            contact.setStatus(ContactStatus.UNSUBSCRIBED);
            contactRepository.save(contact);
            log.info("Contact [{}] unsubscribed via token (campaign={})",
                    contact.getId(), payload.campaignId());
        }
        return true;
    }

    @Transactional
    public void recordOpen(String token) {
        EngagementTokenService.TokenPayload payload =
                tokenService.verify(token, EngagementTokenService.Purpose.OPEN);
        Workspace workspace = workspaceRepository.findById(payload.workspaceId()).orElse(null);
        if (workspace == null || !workspace.isEnableOpenTracking()) {
            return;
        }
        if (!contactBelongs(payload)) {
            return;
        }
        if (eventRepository.existsByCampaignIdAndContactIdAndEventType(
                payload.campaignId(), payload.contactId(), EngagementEventType.OPEN)) {
            return;
        }
        try {
            eventRepository.save(new EmailEngagementEvent(
                    payload.workspaceId(),
                    payload.campaignId(),
                    payload.contactId(),
                    EngagementEventType.OPEN,
                    null
            ));
        } catch (DataIntegrityViolationException ignored) {
            // concurrent first-open race — unique index
        }
    }

    @Transactional
    public String recordClickAndResolve(String token, String targetUrl) {
        EngagementTokenService.TokenPayload payload =
                tokenService.verify(token, EngagementTokenService.Purpose.CLICK);
        Workspace workspace = workspaceRepository.findById(payload.workspaceId()).orElse(null);
        if (workspace == null || !workspace.isEnableClickTracking()) {
            return sanitizeRedirect(targetUrl);
        }
        if (!contactBelongs(payload)) {
            return sanitizeRedirect(targetUrl);
        }
        String safeUrl = sanitizeRedirect(targetUrl);
        eventRepository.save(new EmailEngagementEvent(
                payload.workspaceId(),
                payload.campaignId(),
                payload.contactId(),
                EngagementEventType.CLICK,
                truncate(safeUrl, 2000)
        ));
        return safeUrl;
    }

    @Transactional(readOnly = true)
    public Map<UUID, Rates> ratesForCampaigns(Collection<UUID> campaignIds, Map<UUID, Long> sentByCampaign) {
        Map<UUID, Rates> result = new HashMap<>();
        if (campaignIds == null || campaignIds.isEmpty()) {
            return result;
        }
        List<Object[]> rows = eventRepository.countDistinctContactsByCampaignAndType(campaignIds);
        Map<UUID, Long> opens = new HashMap<>();
        Map<UUID, Long> clicks = new HashMap<>();
        for (Object[] row : rows) {
            UUID campaignId = (UUID) row[0];
            EngagementEventType type = (EngagementEventType) row[1];
            long count = ((Number) row[2]).longValue();
            if (type == EngagementEventType.OPEN) {
                opens.put(campaignId, count);
            } else if (type == EngagementEventType.CLICK) {
                clicks.put(campaignId, count);
            }
        }
        for (UUID campaignId : campaignIds) {
            long sent = sentByCampaign.getOrDefault(campaignId, 0L);
            double openRate = sent <= 0 ? 0 : round1(100.0 * opens.getOrDefault(campaignId, 0L) / sent);
            double clickRate = sent <= 0 ? 0 : round1(100.0 * clicks.getOrDefault(campaignId, 0L) / sent);
            result.put(campaignId, new Rates(openRate, clickRate));
        }
        return result;
    }

    public record Rates(double openRate, double clickRate) {}

    private boolean contactBelongs(EngagementTokenService.TokenPayload payload) {
        Contact contact = contactRepository.findById(payload.contactId()).orElse(null);
        return contact != null && contact.getWorkspaceId().equals(payload.workspaceId());
    }

    public static String sanitizeRedirect(String targetUrl) {
        if (targetUrl == null || targetUrl.isBlank()) {
            return "https://example.com";
        }
        String trimmed = targetUrl.trim();
        String lower = trimmed.toLowerCase();
        if (!(lower.startsWith("https://") || lower.startsWith("http://"))) {
            return "https://example.com";
        }
        return trimmed;
    }

    private static String truncate(String value, int max) {
        if (value == null || value.length() <= max) {
            return value;
        }
        return value.substring(0, max);
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
