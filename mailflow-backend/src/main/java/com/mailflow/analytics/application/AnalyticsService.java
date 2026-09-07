package com.mailflow.analytics.application;

import com.mailflow.analytics.api.response.AnalyticsOverviewResponse;
import com.mailflow.analytics.api.response.AnalyticsTimeseriesResponse;
import com.mailflow.analytics.api.response.CampaignAnalyticsRowResponse;
import com.mailflow.analytics.api.response.CampaignReportResponse;
import com.mailflow.analytics.api.response.EngagementEventResponse;
import com.mailflow.campaign.domain.model.Campaign;
import com.mailflow.campaign.domain.model.CampaignRecipientStatus;
import com.mailflow.campaign.domain.repository.CampaignRecipientRepository;
import com.mailflow.campaign.domain.repository.CampaignRepository;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.contact.domain.model.Contact;
import com.mailflow.contact.domain.repository.ContactRepository;
import com.mailflow.engagement.domain.model.EmailEngagementEvent;
import com.mailflow.engagement.domain.model.EngagementEventType;
import com.mailflow.engagement.domain.repository.EmailEngagementEventRepository;
import com.mailflow.workspace.application.WorkspaceAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("dd/MM");

    private final WorkspaceAccessService accessService;
    private final CampaignRepository campaignRepository;
    private final CampaignRecipientRepository recipientRepository;
    private final EmailEngagementEventRepository eventRepository;
    private final ContactRepository contactRepository;

    @Transactional(readOnly = true)
    public AnalyticsOverviewResponse overview(UUID userId, UUID workspaceId, Instant from, Instant to) {
        accessService.requireCampaignRead(userId, workspaceId);
        Range range = normalizeRange(from, to);
        long sent = recipientRepository.countSentInRange(workspaceId, range.from(), range.to());
        long failed = recipientRepository.countFailedInRange(workspaceId, range.from(), range.to());
        long opens = eventRepository.countDistinctContactsInRange(
                workspaceId, EngagementEventType.OPEN, range.from(), range.to());
        long clicks = eventRepository.countDistinctContactsInRange(
                workspaceId, EngagementEventType.CLICK, range.from(), range.to());
        long unsubs = recipientRepository.countUnsubsInRange(workspaceId, range.from(), range.to());

        long durationSecs = Math.max(1, ChronoUnit.SECONDS.between(range.from(), range.to()));
        Instant prevTo = range.from();
        Instant prevFrom = prevTo.minusSeconds(durationSecs);
        long prevSent = recipientRepository.countSentInRange(workspaceId, prevFrom, prevTo);
        long prevOpens = eventRepository.countDistinctContactsInRange(
                workspaceId, EngagementEventType.OPEN, prevFrom, prevTo);
        long prevClicks = eventRepository.countDistinctContactsInRange(
                workspaceId, EngagementEventType.CLICK, prevFrom, prevTo);

        return AnalyticsOverviewResponse.builder()
                .sent(sent)
                .uniqueOpens(opens)
                .uniqueClicks(clicks)
                .unsubscribes(unsubs)
                .failed(failed)
                .openRate(rate(opens, sent))
                .clickRate(rate(clicks, sent))
                .unsubscribeRate(rate(unsubs, sent))
                .sentChangePct(changePct(sent, prevSent))
                .openChangePct(changePct(opens, prevOpens))
                .clickChangePct(changePct(clicks, prevClicks))
                .build();
    }

    @Transactional(readOnly = true)
    public AnalyticsTimeseriesResponse timeseries(UUID userId, UUID workspaceId, Instant from, Instant to) {
        accessService.requireCampaignRead(userId, workspaceId);
        Range range = normalizeRange(from, to);

        Map<LocalDate, long[]> byDay = new HashMap<>();
        for (Object[] row : recipientRepository.countSentByDay(workspaceId, range.from(), range.to())) {
            LocalDate day = toLocalDate(row[0]);
            long count = ((Number) row[1]).longValue();
            byDay.computeIfAbsent(day, d -> new long[3])[0] = count;
        }
        for (Object[] row : eventRepository.countDistinctByDayAndType(workspaceId, range.from(), range.to())) {
            LocalDate day = toLocalDate(row[0]);
            String type = String.valueOf(row[1]);
            long count = ((Number) row[2]).longValue();
            long[] bucket = byDay.computeIfAbsent(day, d -> new long[3]);
            if ("OPEN".equalsIgnoreCase(type)) {
                bucket[1] = count;
            } else if ("CLICK".equalsIgnoreCase(type)) {
                bucket[2] = count;
            }
        }

        LocalDate start = LocalDate.ofInstant(range.from(), ZoneOffset.UTC);
        LocalDate end = LocalDate.ofInstant(range.to().minusMillis(1), ZoneOffset.UTC);
        List<AnalyticsTimeseriesResponse.Point> points = new ArrayList<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            long[] bucket = byDay.getOrDefault(d, new long[3]);
            points.add(AnalyticsTimeseriesResponse.Point.builder()
                    .date(d.format(DAY_LABEL))
                    .sent(bucket[0])
                    .opened(bucket[1])
                    .clicked(bucket[2])
                    .build());
        }
        return AnalyticsTimeseriesResponse.builder().points(points).build();
    }

    @Transactional(readOnly = true)
    public List<CampaignAnalyticsRowResponse> campaigns(UUID userId, UUID workspaceId, Instant from, Instant to) {
        accessService.requireCampaignRead(userId, workspaceId);
        Range range = normalizeRange(from, to);
        List<Campaign> campaigns = campaignRepository.findSentInRange(workspaceId, range.from(), range.to());
        List<CampaignAnalyticsRowResponse> rows = new ArrayList<>(campaigns.size());
        for (Campaign campaign : campaigns) {
            rows.add(toCampaignRow(campaign));
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public CampaignReportResponse campaignReport(UUID userId, UUID workspaceId, UUID campaignId) {
        accessService.requireCampaignRead(userId, workspaceId);
        Campaign campaign = requireCampaign(workspaceId, campaignId);
        long sent = recipientRepository.countByCampaignIdAndStatus(campaignId, CampaignRecipientStatus.SENT);
        long failed = recipientRepository.countByCampaignIdAndStatus(campaignId, CampaignRecipientStatus.FAILED);
        long opens = eventRepository.countDistinctContactsByCampaignAndEventType(
                campaignId, EngagementEventType.OPEN);
        long clicks = eventRepository.countDistinctContactsByCampaignAndEventType(
                campaignId, EngagementEventType.CLICK);
        long unsubs = recipientRepository.countUnsubscribedRecipients(campaignId);

        List<CampaignReportResponse.TopLink> topLinks = new ArrayList<>();
        for (Object[] row : eventRepository.topClickedUrls(campaignId, PageRequest.of(0, 10))) {
            topLinks.add(CampaignReportResponse.TopLink.builder()
                    .url((String) row[0])
                    .clicks(((Number) row[1]).longValue())
                    .build());
        }

        return CampaignReportResponse.builder()
                .campaignId(campaign.getId())
                .name(campaign.getName())
                .status(campaign.getStatus().name())
                .sentCount(sent)
                .failedCount(failed)
                .uniqueOpens(opens)
                .uniqueClicks(clicks)
                .unsubscribedRecipients(unsubs)
                .openRate(rate(opens, sent))
                .clickRate(rate(clicks, sent))
                .unsubscribeRate(rate(unsubs, sent))
                .bounceRate(0)
                .startedAt(campaign.getStartedAt())
                .completedAt(campaign.getCompletedAt())
                .topLinks(topLinks)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<EngagementEventResponse> campaignEngagements(
            UUID userId,
            UUID workspaceId,
            UUID campaignId,
            String type,
            int page,
            int size
    ) {
        accessService.requireCampaignRead(userId, workspaceId);
        requireCampaign(workspaceId, campaignId);
        EngagementEventType eventType = parseOptionalType(type);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        Page<EmailEngagementEvent> events =
                eventRepository.findByCampaignIdAndOptionalType(campaignId, eventType, pageable);
        return mapEngagementPage(events);
    }

    @Transactional(readOnly = true)
    public Page<EngagementEventResponse> contactEngagements(
            UUID userId,
            UUID workspaceId,
            UUID contactId,
            int page,
            int size
    ) {
        accessService.requireContactRead(userId, workspaceId);
        Contact contact = contactRepository.findById(contactId)
                .filter(c -> c.getWorkspaceId().equals(workspaceId))
                .orElseThrow(() -> new ResourceNotFoundException("Liên hệ", contactId.toString()));
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        Page<EmailEngagementEvent> events =
                eventRepository.findByWorkspaceIdAndContactId(workspaceId, contact.getId(), pageable);
        return mapEngagementPage(events);
    }

    private CampaignAnalyticsRowResponse toCampaignRow(Campaign campaign) {
        long sent = campaign.getSentCount();
        if (sent <= 0) {
            sent = recipientRepository.countByCampaignIdAndStatus(
                    campaign.getId(), CampaignRecipientStatus.SENT);
        }
        long failed = recipientRepository.countByCampaignIdAndStatus(
                campaign.getId(), CampaignRecipientStatus.FAILED);
        long opens = eventRepository.countDistinctContactsByCampaignAndEventType(
                campaign.getId(), EngagementEventType.OPEN);
        long clicks = eventRepository.countDistinctContactsByCampaignAndEventType(
                campaign.getId(), EngagementEventType.CLICK);
        long unsubs = recipientRepository.countUnsubscribedRecipients(campaign.getId());
        long denom = sent + failed;
        return CampaignAnalyticsRowResponse.builder()
                .id(campaign.getId())
                .name(campaign.getName())
                .sentAt(campaign.getStartedAt())
                .recipientsSent(sent)
                .deliveryRate(rate(sent, denom <= 0 ? sent : denom))
                .openRate(rate(opens, sent))
                .clickRate(rate(clicks, sent))
                .bounceRate(0)
                .unsubscribeRate(rate(unsubs, sent))
                .build();
    }

    private Page<EngagementEventResponse> mapEngagementPage(Page<EmailEngagementEvent> events) {
        Set<UUID> contactIds = new HashSet<>();
        for (EmailEngagementEvent e : events.getContent()) {
            contactIds.add(e.getContactId());
        }
        Map<UUID, String> emails = new HashMap<>();
        if (!contactIds.isEmpty()) {
            for (Contact c : contactRepository.findAllById(contactIds)) {
                emails.put(c.getId(), c.getEmail());
            }
        }
        return events.map(e -> EngagementEventResponse.builder()
                .id(e.getId())
                .campaignId(e.getCampaignId())
                .contactId(e.getContactId())
                .contactEmail(emails.getOrDefault(e.getContactId(), "—"))
                .eventType(e.getEventType().name())
                .targetUrl(e.getTargetUrl())
                .createdAt(e.getCreatedAt())
                .build());
    }

    private Campaign requireCampaign(UUID workspaceId, UUID campaignId) {
        return campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Chiến dịch", campaignId.toString()));
    }

    private static Range normalizeRange(Instant from, Instant to) {
        Instant end = to == null ? Instant.now() : to;
        Instant start = from == null ? end.minus(30, ChronoUnit.DAYS) : from;
        if (!start.isBefore(end)) {
            start = end.minus(30, ChronoUnit.DAYS);
        }
        // Cap window at 90 days for timeseries density
        if (ChronoUnit.DAYS.between(start, end) > 90) {
            start = end.minus(90, ChronoUnit.DAYS);
        }
        return new Range(start, end);
    }

    private static EngagementEventType parseOptionalType(String type) {
        if (type == null || type.isBlank()) {
            return null;
        }
        try {
            return EngagementEventType.valueOf(type.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        if (value instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        if (value instanceof Instant instant) {
            return LocalDate.ofInstant(instant, ZoneOffset.UTC);
        }
        return LocalDate.parse(String.valueOf(value));
    }

    private static double rate(long part, long whole) {
        if (whole <= 0) {
            return 0;
        }
        return Math.round(1000.0 * part / whole) / 10.0;
    }

    private static Double changePct(long current, long previous) {
        if (previous <= 0) {
            return current > 0 ? 100.0 : null;
        }
        return Math.round(1000.0 * (current - previous) / previous) / 10.0;
    }

    private record Range(Instant from, Instant to) {}
}
