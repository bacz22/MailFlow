package com.mailflow.campaign.application;

import com.mailflow.audiencelist.domain.model.AudienceList;
import com.mailflow.audiencelist.domain.repository.AudienceListMemberRepository;
import com.mailflow.audiencelist.domain.repository.AudienceListRepository;
import com.mailflow.audiencesegment.application.SegmentMatchQueryService;
import com.mailflow.audiencesegment.domain.model.AudienceSegment;
import com.mailflow.audiencesegment.domain.repository.AudienceSegmentRepository;
import com.mailflow.campaign.api.request.ReviewCampaignRequest;
import com.mailflow.campaign.api.request.SendTestCampaignRequest;
import com.mailflow.campaign.api.request.UpsertCampaignRequest;
import com.mailflow.campaign.api.response.CampaignResponse;
import com.mailflow.campaign.domain.model.Campaign;
import com.mailflow.campaign.domain.model.CampaignRecipient;
import com.mailflow.campaign.domain.model.CampaignRecipientStatus;
import com.mailflow.campaign.domain.model.CampaignStatus;
import com.mailflow.campaign.domain.repository.CampaignRecipientRepository;
import com.mailflow.campaign.domain.repository.CampaignRepository;
import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.contact.domain.model.Contact;
import com.mailflow.emailsender.domain.model.EmailSenderIdentity;
import com.mailflow.emailsender.domain.model.EmailSenderStatus;
import com.mailflow.emailsender.domain.repository.EmailSenderIdentityRepository;
import com.mailflow.emailtemplate.application.EmailTemplateLayout;
import com.mailflow.emailtemplate.application.EmailTemplateMerge;
import com.mailflow.emailtemplate.domain.model.EmailTemplate;
import com.mailflow.emailtemplate.domain.repository.EmailTemplateRepository;
import com.mailflow.engagement.application.EngagementService;
import com.mailflow.engagement.application.PublicTrackingUrls;
import com.mailflow.infrastructure.mail.CampaignMailRouter;
import com.mailflow.infrastructure.mail.ListUnsubscribeHeaders;
import com.mailflow.quota.application.QuotaService;
import com.mailflow.sendingdomain.domain.model.SendingDomain;
import com.mailflow.sendingdomain.domain.model.SendingDomainStatus;
import com.mailflow.sendingdomain.domain.repository.SendingDomainRepository;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.repository.UserRepository;
import com.mailflow.workspace.application.WorkspaceAccessService;
import com.mailflow.workspace.domain.model.Workspace;
import com.mailflow.workspace.domain.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampaignService {

    private static final Set<CampaignStatus> EDITABLE = EnumSet.of(
            CampaignStatus.DRAFT, CampaignStatus.REJECTED);
    private static final Set<CampaignStatus> DELETABLE = EnumSet.of(
            CampaignStatus.DRAFT, CampaignStatus.REJECTED, CampaignStatus.CANCELLED);
    private static final Set<CampaignStatus> CANCELLABLE = EnumSet.of(
            CampaignStatus.DRAFT,
            CampaignStatus.PENDING_APPROVAL,
            CampaignStatus.APPROVED,
            CampaignStatus.SCHEDULED,
            CampaignStatus.SENDING,
            CampaignStatus.PAUSED,
            CampaignStatus.REJECTED);
    private static final Set<CampaignRecipientStatus> SKIPPABLE = EnumSet.of(
            CampaignRecipientStatus.PENDING,
            CampaignRecipientStatus.SENDING);

    private final CampaignRepository campaignRepository;
    private final CampaignRecipientRepository recipientRepository;
    private final CampaignAudienceResolver audienceResolver;
    private final CampaignSendProcessor sendProcessor;
    private final EmailSenderIdentityRepository senderRepository;
    private final EmailTemplateRepository templateRepository;
    private final AudienceListRepository audienceListRepository;
    private final AudienceListMemberRepository audienceListMemberRepository;
    private final AudienceSegmentRepository audienceSegmentRepository;
    private final SegmentMatchQueryService matchQueryService;
    private final UserRepository userRepository;
    private final WorkspaceAccessService accessService;
    private final CampaignMailRouter campaignMailRouter;
    private final SendingDomainRepository sendingDomainRepository;
    private final QuotaService quotaService;
    private final PublicTrackingUrls trackingUrls;
    private final EngagementService engagementService;
    private final WorkspaceRepository workspaceRepository;

    @Transactional(readOnly = true)
    public List<CampaignResponse> list(UUID userId, UUID workspaceId, String q, String status) {
        accessService.requireCampaignRead(userId, workspaceId);
        CampaignStatus statusFilter = parseOptionalStatus(status);
        String like = toLike(q);
        List<Campaign> campaigns = campaignRepository.search(workspaceId, like, statusFilter);
        return toResponses(workspaceId, campaigns);
    }

    @Transactional(readOnly = true)
    public CampaignResponse get(UUID userId, UUID workspaceId, UUID campaignId) {
        accessService.requireCampaignRead(userId, workspaceId);
        Campaign campaign = requireCampaign(workspaceId, campaignId);
        return toResponses(workspaceId, List.of(campaign)).getFirst();
    }

    @Transactional
    public CampaignResponse create(UUID userId, UUID workspaceId, UpsertCampaignRequest request) {
        accessService.requireCampaignWrite(userId, workspaceId);
        String name = requireName(request.getName());
        String subject = requireSubject(request.getSubject());
        Campaign campaign = new Campaign(workspaceId, name, subject, userId);
        applyContent(workspaceId, campaign, request);
        campaign = campaignRepository.save(campaign);
        return toResponses(workspaceId, List.of(campaign)).getFirst();
    }

    @Transactional
    public CampaignResponse update(
            UUID userId,
            UUID workspaceId,
            UUID campaignId,
            UpsertCampaignRequest request
    ) {
        accessService.requireCampaignWrite(userId, workspaceId);
        Campaign campaign = requireCampaign(workspaceId, campaignId);
        assertEditable(campaign);
        campaign.setName(requireName(request.getName()));
        campaign.setSubject(requireSubject(request.getSubject()));
        applyContent(workspaceId, campaign, request);
        campaign = campaignRepository.save(campaign);
        return toResponses(workspaceId, List.of(campaign)).getFirst();
    }

    @Transactional
    public void delete(UUID userId, UUID workspaceId, UUID campaignId) {
        accessService.requireCampaignDelete(userId, workspaceId);
        Campaign campaign = requireCampaign(workspaceId, campaignId);
        if (!DELETABLE.contains(campaign.getStatus())) {
            throw new AppException(HttpStatus.CONFLICT, "CAMPAIGN_NOT_DELETABLE",
                    "Chỉ có thể xóa chiến dịch nháp, bị từ chối hoặc đã hủy.");
        }
        campaignRepository.delete(campaign);
    }

    @Transactional
    public CampaignResponse submit(UUID userId, UUID workspaceId, UUID campaignId) {
        accessService.requireCampaignWrite(userId, workspaceId);
        Campaign campaign = requireCampaign(workspaceId, campaignId);
        if (campaign.getStatus() != CampaignStatus.DRAFT && campaign.getStatus() != CampaignStatus.REJECTED) {
            throw new AppException(HttpStatus.CONFLICT, "CAMPAIGN_SUBMIT_INVALID",
                    "Chỉ gửi duyệt chiến dịch đang nháp hoặc bị từ chối.");
        }
        assertReadyToSubmit(workspaceId, campaign);
        campaign.setStatus(CampaignStatus.PENDING_APPROVAL);
        campaign.setSubmittedAt(Instant.now());
        campaign.setReviewNote(null);
        campaign.setReviewedAt(null);
        campaign = campaignRepository.save(campaign);
        return toResponses(workspaceId, List.of(campaign)).getFirst();
    }

    @Transactional
    public CampaignResponse approve(
            UUID userId,
            UUID workspaceId,
            UUID campaignId,
            ReviewCampaignRequest request
    ) {
        accessService.requireCampaignApprove(userId, workspaceId);
        Campaign campaign = requireCampaign(workspaceId, campaignId);
        if (campaign.getStatus() != CampaignStatus.PENDING_APPROVAL) {
            throw new AppException(HttpStatus.CONFLICT, "CAMPAIGN_APPROVE_INVALID",
                    "Chỉ phê duyệt chiến dịch đang chờ duyệt.");
        }
        assertReadyToSubmit(workspaceId, campaign);
        boolean scheduled = "scheduled".equals(campaign.getSendType()) && campaign.getScheduledAt() != null;
        campaign.setReviewedAt(Instant.now());
        campaign.setReviewNote(blankToNull(request == null ? null : request.getNote()));
        if (scheduled) {
            campaign.setStatus(CampaignStatus.SCHEDULED);
            campaign = campaignRepository.save(campaign);
        } else {
            campaign = campaignRepository.save(campaign);
            campaign = startSending(campaign);
        }
        return toResponses(workspaceId, List.of(campaign)).getFirst();
    }

    @Transactional
    public CampaignResponse reject(
            UUID userId,
            UUID workspaceId,
            UUID campaignId,
            ReviewCampaignRequest request
    ) {
        accessService.requireCampaignApprove(userId, workspaceId);
        Campaign campaign = requireCampaign(workspaceId, campaignId);
        if (campaign.getStatus() != CampaignStatus.PENDING_APPROVAL) {
            throw new AppException(HttpStatus.CONFLICT, "CAMPAIGN_REJECT_INVALID",
                    "Chỉ từ chối chiến dịch đang chờ duyệt.");
        }
        String note = request == null ? null : request.getNote();
        if (note == null || note.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CAMPAIGN_REJECT_NOTE_REQUIRED",
                    "Vui lòng nhập lý do từ chối.");
        }
        campaign.setStatus(CampaignStatus.REJECTED);
        campaign.setReviewedAt(Instant.now());
        campaign.setReviewNote(note.trim());
        campaign = campaignRepository.save(campaign);
        return toResponses(workspaceId, List.of(campaign)).getFirst();
    }

    @Transactional
    public CampaignResponse cancel(UUID userId, UUID workspaceId, UUID campaignId) {
        accessService.requireCampaignWrite(userId, workspaceId);
        Campaign campaign = requireCampaign(workspaceId, campaignId);
        if (!CANCELLABLE.contains(campaign.getStatus())) {
            throw new AppException(HttpStatus.CONFLICT, "CAMPAIGN_CANCEL_INVALID",
                    "Không thể hủy chiến dịch ở trạng thái hiện tại.");
        }
        campaign.setStatus(CampaignStatus.CANCELLED);
        campaign.setCompletedAt(Instant.now());
        recipientRepository.skipByCampaignIdAndStatusIn(campaign.getId(), SKIPPABLE);
        campaign = campaignRepository.save(campaign);
        return toResponses(workspaceId, List.of(campaign)).getFirst();
    }

    @Transactional
    public CampaignResponse send(UUID userId, UUID workspaceId, UUID campaignId) {
        accessService.requireCampaignSend(userId, workspaceId);
        Campaign campaign = requireCampaign(workspaceId, campaignId);
        if (campaign.getStatus() != CampaignStatus.APPROVED) {
            throw new AppException(HttpStatus.CONFLICT, "CAMPAIGN_SEND_INVALID",
                    "Chỉ gửi chiến dịch đã được phê duyệt.");
        }
        assertReadyToSubmit(workspaceId, campaign);
        campaign = startSending(campaign);
        return toResponses(workspaceId, List.of(campaign)).getFirst();
    }

    @Transactional
    public CampaignResponse pause(UUID userId, UUID workspaceId, UUID campaignId) {
        accessService.requireCampaignSend(userId, workspaceId);
        Campaign campaign = requireCampaign(workspaceId, campaignId);
        if (campaign.getStatus() != CampaignStatus.SENDING) {
            throw new AppException(HttpStatus.CONFLICT, "CAMPAIGN_PAUSE_INVALID",
                    "Chỉ tạm dừng chiến dịch đang gửi.");
        }
        campaign.setStatus(CampaignStatus.PAUSED);
        campaign = campaignRepository.save(campaign);
        return toResponses(workspaceId, List.of(campaign)).getFirst();
    }

    @Transactional
    public CampaignResponse resume(UUID userId, UUID workspaceId, UUID campaignId) {
        accessService.requireCampaignSend(userId, workspaceId);
        Campaign campaign = requireCampaign(workspaceId, campaignId);
        if (campaign.getStatus() != CampaignStatus.PAUSED) {
            throw new AppException(HttpStatus.CONFLICT, "CAMPAIGN_RESUME_INVALID",
                    "Chỉ tiếp tục chiến dịch đang tạm dừng.");
        }
        campaign.setStatus(CampaignStatus.SENDING);
        campaign = campaignRepository.save(campaign);
        return toResponses(workspaceId, List.of(campaign)).getFirst();
    }

    @Transactional
    public void startDueScheduledCampaigns() {
        Instant now = Instant.now();
        List<Campaign> due = campaignRepository.findByStatusAndScheduledAtLessThanEqual(
                CampaignStatus.SCHEDULED, now);
        for (Campaign campaign : due) {
            try {
                if (campaign.getSenderId() != null) {
                    EmailSenderIdentity sender = requireSender(campaign.getWorkspaceId(), campaign.getSenderId());
                    campaignMailRouter.requireVerifiedSendingDomain(campaign.getWorkspaceId(), sender);
                }
                startSending(campaign);
            } catch (Exception ex) {
                log.error("Không khởi chạy chiến dịch lịch [{}]: {}", campaign.getId(), ex.getMessage(), ex);
                campaign.setStatus(CampaignStatus.FAILED);
                campaign.setCompletedAt(Instant.now());
                campaignRepository.save(campaign);
            }
        }
    }

    /**
     * Claim PENDING recipients one-by-one (each in its own TX via {@link CampaignSendProcessor}).
     */
    public int processPendingRecipients(int batchSize) {
        sendProcessor.recoverStuckSendingRecipients();
        List<UUID> ids = sendProcessor.findPendingRecipientIds(batchSize);
        for (UUID recipientId : ids) {
            try {
                sendProcessor.processOne(recipientId);
            } catch (Exception ex) {
                log.error("processOne [{}] failed: {}", recipientId, ex.getMessage(), ex);
            }
        }
        sendProcessor.finalizeSendingCampaigns();
        return ids.size();
    }

    private Campaign startSending(Campaign campaign) {
        enqueueRecipients(campaign);
        long pending = recipientRepository.countByCampaignIdAndStatus(
                campaign.getId(), CampaignRecipientStatus.PENDING);
        if (pending > 0) {
            quotaService.assertCanSend(campaign.getWorkspaceId(), pending);
        }
        campaign.setStatus(CampaignStatus.SENDING);
        if (campaign.getStartedAt() == null) {
            campaign.setStartedAt(Instant.now());
        }
        campaign.setCompletedAt(null);
        return campaignRepository.save(campaign);
    }

    private void enqueueRecipients(Campaign campaign) {
        if (recipientRepository.existsByCampaignId(campaign.getId())) {
            long pending = recipientRepository.countByCampaignIdAndStatus(
                    campaign.getId(), CampaignRecipientStatus.PENDING);
            if (pending == 0 && campaign.getSentCount() == 0) {
                // Already enqueued and finished or empty — allow re-count from existing rows
                long total = recipientRepository.countByCampaignId(campaign.getId());
                campaign.setEstimatedRecipients(total);
            }
            return;
        }
        List<Contact> contacts = audienceResolver.resolveActiveRecipients(campaign);
        List<CampaignRecipient> rows = new ArrayList<>(contacts.size());
        for (Contact contact : contacts) {
            rows.add(new CampaignRecipient(
                    campaign.getId(),
                    campaign.getWorkspaceId(),
                    contact.getId(),
                    contact.getEmail()
            ));
        }
        if (!rows.isEmpty()) {
            recipientRepository.saveAll(rows);
        }
        campaign.setEstimatedRecipients(rows.size());
        campaign.setSentCount(0);
    }

    @Transactional(readOnly = true)
    public void sendTest(
            UUID userId,
            UUID workspaceId,
            UUID campaignId,
            SendTestCampaignRequest request
    ) {
        accessService.requireCampaignWrite(userId, workspaceId);
        Campaign campaign = requireCampaign(workspaceId, campaignId);
        String to = request.getTo() == null ? "" : request.getTo().trim().toLowerCase(Locale.ROOT);
        UUID testContactId = UUID.fromString("00000000-0000-0000-0000-000000000000");
        String unsubscribeUrl = trackingUrls.unsubscribeUrl(workspaceId, campaignId, testContactId);
        Workspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
        boolean enforceRfc = workspace == null || workspace.isEnforceRfc8058();
        String subject = "[TEST] " + EmailTemplateMerge.applySubject(
                campaign.getSubject(),
                request.getFirstName(),
                request.getLastName(),
                to,
                request.getCompany()
        );
        String body = EmailTemplateMerge.applyHtml(
                campaign.getHtmlContent(),
                request.getFirstName(),
                request.getLastName(),
                to,
                request.getCompany(),
                request.getPhone(),
                unsubscribeUrl
        );
        EmailTemplate template = campaign.getTemplateId() == null
                ? null
                : templateRepository.findByIdAndWorkspaceId(campaign.getTemplateId(), workspaceId).orElse(null);
        String wrapped = template != null
                ? EmailTemplateLayout.wrap(template, body, unsubscribeUrl)
                : EmailTemplateLayout.wrap(
                        EmailTemplate.DEFAULT_THUMBNAIL,
                        "Chiến dịch",
                        campaign.getName(),
                        body,
                        unsubscribeUrl
                );
        EmailSenderIdentity sender = campaign.getSenderId() == null
                ? null
                : senderRepository.findByIdAndWorkspaceId(campaign.getSenderId(), workspaceId).orElse(null);
        if (sender != null) {
            campaignMailRouter.requireVerifiedSendingDomain(workspaceId, sender);
        }
        quotaService.consumeSendSlot(workspaceId, 1);
        ListUnsubscribeHeaders headers = enforceRfc
                ? new ListUnsubscribeHeaders(unsubscribeUrl, unsubscribeUrl)
                : null;
        try {
            campaignMailRouter.sendHtml(to, subject, wrapped, sender, campaign.getReplyTo(), headers);
        } catch (RuntimeException ex) {
            quotaService.releaseSendSlot(workspaceId, 1);
            throw ex;
        }
    }

    private void applyContent(UUID workspaceId, Campaign campaign, UpsertCampaignRequest request) {
        campaign.setPreviewText(blankToNull(request.getPreviewText()));
        campaign.setReplyTo(blankToNull(request.getReplyTo()));
        UUID senderId = request.getSenderId();
        if (senderId != null) {
            requireSender(workspaceId, senderId);
        }
        campaign.setSenderId(senderId);
        UUID templateId = request.getTemplateId();
        EmailTemplate template = null;
        if (templateId != null) {
            template = templateRepository.findByIdAndWorkspaceId(templateId, workspaceId)
                    .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "TEMPLATE_NOT_FOUND",
                            "Mẫu email không tồn tại trong workspace."));
        }
        campaign.setTemplateId(templateId);
        String html = request.getHtmlContent() == null ? "" : request.getHtmlContent();
        if (html.isBlank() && template != null && template.getHtmlContent() != null) {
            html = template.getHtmlContent();
        }
        campaign.setHtmlContent(html);
        String sendType = request.getSendType() == null || request.getSendType().isBlank()
                ? "immediate"
                : request.getSendType().trim().toLowerCase(Locale.ROOT);
        if (!"immediate".equals(sendType) && !"scheduled".equals(sendType)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CAMPAIGN_SEND_TYPE_INVALID",
                    "Kiểu gửi không hợp lệ.");
        }
        campaign.setSendType(sendType);
        campaign.setScheduledAt("scheduled".equals(sendType) ? request.getScheduledAt() : null);
        UUID[] listIds = toArray(request.getListIds());
        UUID[] segmentIds = toArray(request.getSegmentIds());
        UUID[] excluded = toArray(request.getExcludedListIds());
        validateLists(workspaceId, listIds);
        validateLists(workspaceId, excluded);
        validateSegments(workspaceId, segmentIds);
        campaign.setListIds(listIds);
        campaign.setSegmentIds(segmentIds);
        campaign.setExcludedListIds(excluded);
        campaign.setEstimatedRecipients(estimateRecipients(workspaceId, listIds, segmentIds, excluded));
    }

    private void assertReadyToSubmit(UUID workspaceId, Campaign campaign) {
        if (campaign.getSenderId() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CAMPAIGN_SENDER_REQUIRED",
                    "Vui lòng chọn người gửi đã kích hoạt.");
        }
        EmailSenderIdentity sender = requireSender(workspaceId, campaign.getSenderId());
        if (sender.getStatus() != EmailSenderStatus.ACTIVE) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CAMPAIGN_SENDER_INACTIVE",
                    "Người gửi chưa được kích hoạt.");
        }
        campaignMailRouter.requireVerifiedSendingDomain(workspaceId, sender);
        if (campaign.getHtmlContent() == null || campaign.getHtmlContent().isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CAMPAIGN_HTML_REQUIRED",
                    "Vui lòng nhập nội dung email.");
        }
        boolean hasAudience = (campaign.getListIds() != null && campaign.getListIds().length > 0)
                || (campaign.getSegmentIds() != null && campaign.getSegmentIds().length > 0);
        if (!hasAudience) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CAMPAIGN_AUDIENCE_REQUIRED",
                    "Vui lòng chọn danh sách hoặc phân đoạn người nhận.");
        }
        if ("scheduled".equals(campaign.getSendType()) && campaign.getScheduledAt() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CAMPAIGN_SCHEDULE_REQUIRED",
                    "Vui lòng chọn thời điểm gửi.");
        }
    }

    private void assertEditable(Campaign campaign) {
        if (!EDITABLE.contains(campaign.getStatus())) {
            throw new AppException(HttpStatus.CONFLICT, "CAMPAIGN_NOT_EDITABLE",
                    "Chỉ chỉnh sửa chiến dịch nháp hoặc bị từ chối.");
        }
    }

    private EmailSenderIdentity requireSender(UUID workspaceId, UUID senderId) {
        return senderRepository.findByIdAndWorkspaceId(senderId, workspaceId)
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "SENDER_NOT_FOUND",
                        "Người gửi không tồn tại trong workspace."));
    }

    private void validateLists(UUID workspaceId, UUID[] ids) {
        for (UUID id : ids) {
            audienceListRepository.findByIdAndWorkspaceId(id, workspaceId)
                    .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "LIST_NOT_FOUND",
                            "Danh sách không tồn tại trong workspace."));
        }
    }

    private void validateSegments(UUID workspaceId, UUID[] ids) {
        for (UUID id : ids) {
            audienceSegmentRepository.findByIdAndWorkspaceId(id, workspaceId)
                    .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_NOT_FOUND",
                            "Phân đoạn không tồn tại trong workspace."));
        }
    }

    private long estimateRecipients(UUID workspaceId, UUID[] listIds, UUID[] segmentIds, UUID[] excluded) {
        long included = sumActiveMembers(listIds);
        for (UUID segmentId : segmentIds) {
            AudienceSegment segment = audienceSegmentRepository.findByIdAndWorkspaceId(segmentId, workspaceId)
                    .orElse(null);
            if (segment == null) {
                continue;
            }
            included += matchQueryService.count(workspaceId, segment.getMatchLogic(), segment.getConditions());
        }
        long excludedCount = sumActiveMembers(excluded);
        return Math.max(0L, included - excludedCount);
    }

    private long sumActiveMembers(UUID[] listIds) {
        if (listIds == null || listIds.length == 0) {
            return 0L;
        }
        long total = 0L;
        for (Object[] row : audienceListMemberRepository.countMembersByListIds(Arrays.asList(listIds))) {
            total += ((Number) row[2]).longValue();
        }
        return total;
    }

    private Campaign requireCampaign(UUID workspaceId, UUID campaignId) {
        return campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Chiến dịch", campaignId.toString()));
    }

    private List<CampaignResponse> toResponses(UUID workspaceId, List<Campaign> campaigns) {
        Map<UUID, String> creators = loadCreatorNames(campaigns);
        Map<UUID, EmailSenderIdentity> senders = loadSenders(campaigns);
        Map<UUID, SendingDomain> domains = loadSenderDomains(senders);
        Map<UUID, String> listNames = loadListNames(workspaceId, campaigns);
        Map<UUID, String> segmentNames = loadSegmentNames(workspaceId, campaigns);
        Map<UUID, Long> sentByCampaign = new HashMap<>();
        List<UUID> campaignIds = new ArrayList<>();
        for (Campaign campaign : campaigns) {
            campaignIds.add(campaign.getId());
            sentByCampaign.put(campaign.getId(), campaign.getSentCount());
        }
        Map<UUID, EngagementService.Rates> rates = engagementService.ratesForCampaigns(campaignIds, sentByCampaign);
        List<CampaignResponse> out = new ArrayList<>();
        for (Campaign campaign : campaigns) {
            EngagementService.Rates r = rates.getOrDefault(campaign.getId(), new EngagementService.Rates(0, 0));
            out.add(toResponse(campaign, creators, senders, domains, listNames, segmentNames, r));
        }
        return out;
    }

    private CampaignResponse toResponse(
            Campaign campaign,
            Map<UUID, String> creators,
            Map<UUID, EmailSenderIdentity> senders,
            Map<UUID, SendingDomain> domains,
            Map<UUID, String> listNames,
            Map<UUID, String> segmentNames,
            EngagementService.Rates rates
    ) {
        List<UUID> lists = toList(campaign.getListIds());
        List<UUID> segments = toList(campaign.getSegmentIds());
        String audienceName = "—";
        String audienceType = "list";
        if (!lists.isEmpty()) {
            audienceName = listNames.getOrDefault(lists.getFirst(), "Danh sách");
            audienceType = "list";
        } else if (!segments.isEmpty()) {
            audienceName = segmentNames.getOrDefault(segments.getFirst(), "Phân đoạn");
            audienceType = "segment";
        }
        EmailSenderIdentity sender = campaign.getSenderId() == null ? null : senders.get(campaign.getSenderId());
        boolean senderDomainVerified = false;
        if (sender != null && sender.getDomainId() != null) {
            SendingDomain domain = domains.get(sender.getDomainId());
            senderDomainVerified = domain != null && domain.getStatus() == SendingDomainStatus.VERIFIED;
        }
        String createdBy = campaign.getCreatedBy() == null
                ? "—"
                : creators.getOrDefault(campaign.getCreatedBy(), "—");
        List<CampaignResponse.NamedAudienceRef> listRefs = toNamedRefs(lists, listNames);
        List<CampaignResponse.NamedAudienceRef> segmentRefs = toNamedRefs(toList(campaign.getSegmentIds()), segmentNames);
        List<CampaignResponse.NamedAudienceRef> excludedRefs = toNamedRefs(toList(campaign.getExcludedListIds()), listNames);
        return CampaignResponse.builder()
                .id(campaign.getId())
                .name(campaign.getName())
                .subject(campaign.getSubject())
                .previewText(campaign.getPreviewText())
                .status(campaign.getStatus().name())
                .audienceName(audienceName)
                .audienceType(audienceType)
                .recipientCount(campaign.getEstimatedRecipients())
                .sentCount(campaign.getSentCount())
                .openRate(rates.openRate())
                .clickRate(rates.clickRate())
                .scheduledAt(campaign.getScheduledAt())
                .sentAt(campaign.getStartedAt())
                .createdBy(createdBy)
                .createdAt(campaign.getCreatedAt())
                .updatedAt(campaign.getUpdatedAt())
                .senderId(campaign.getSenderId())
                .senderName(sender == null ? null : sender.getName())
                .senderEmail(sender == null ? null : sender.getEmail())
                .senderDomainVerified(senderDomainVerified)
                .replyTo(campaign.getReplyTo())
                .templateId(campaign.getTemplateId())
                .htmlContent(campaign.getHtmlContent())
                .sendType(campaign.getSendType())
                .reviewNote(campaign.getReviewNote())
                .submittedAt(campaign.getSubmittedAt())
                .reviewedAt(campaign.getReviewedAt())
                .lists(listRefs)
                .segments(segmentRefs)
                .excludedLists(excludedRefs)
                .listIds(lists)
                .segmentIds(toList(campaign.getSegmentIds()))
                .excludedListIds(toList(campaign.getExcludedListIds()))
                .build();
    }

    private static List<CampaignResponse.NamedAudienceRef> toNamedRefs(
            List<UUID> ids,
            Map<UUID, String> names
    ) {
        List<CampaignResponse.NamedAudienceRef> refs = new ArrayList<>();
        for (UUID id : ids) {
            refs.add(CampaignResponse.NamedAudienceRef.builder()
                    .id(id)
                    .name(names.getOrDefault(id, "—"))
                    .build());
        }
        return refs;
    }

    private Map<UUID, String> loadCreatorNames(List<Campaign> campaigns) {
        Set<UUID> ids = new HashSet<>();
        for (Campaign campaign : campaigns) {
            if (campaign.getCreatedBy() != null) {
                ids.add(campaign.getCreatedBy());
            }
        }
        Map<UUID, String> names = new HashMap<>();
        if (ids.isEmpty()) {
            return names;
        }
        for (User user : userRepository.findAllById(ids)) {
            names.put(user.getId(), displayName(user));
        }
        return names;
    }

    private Map<UUID, EmailSenderIdentity> loadSenders(List<Campaign> campaigns) {
        Set<UUID> ids = new HashSet<>();
        for (Campaign campaign : campaigns) {
            if (campaign.getSenderId() != null) {
                ids.add(campaign.getSenderId());
            }
        }
        Map<UUID, EmailSenderIdentity> senders = new HashMap<>();
        if (ids.isEmpty()) {
            return senders;
        }
        for (EmailSenderIdentity sender : senderRepository.findAllById(ids)) {
            senders.put(sender.getId(), sender);
        }
        return senders;
    }

    private Map<UUID, SendingDomain> loadSenderDomains(Map<UUID, EmailSenderIdentity> senders) {
        Set<UUID> ids = new HashSet<>();
        for (EmailSenderIdentity sender : senders.values()) {
            if (sender.getDomainId() != null) {
                ids.add(sender.getDomainId());
            }
        }
        Map<UUID, SendingDomain> domains = new HashMap<>();
        if (ids.isEmpty()) {
            return domains;
        }
        for (SendingDomain domain : sendingDomainRepository.findAllById(ids)) {
            domains.put(domain.getId(), domain);
        }
        return domains;
    }

    private Map<UUID, String> loadListNames(UUID workspaceId, List<Campaign> campaigns) {
        Set<UUID> ids = new HashSet<>();
        for (Campaign campaign : campaigns) {
            ids.addAll(toList(campaign.getListIds()));
            ids.addAll(toList(campaign.getExcludedListIds()));
        }
        Map<UUID, String> names = new HashMap<>();
        if (ids.isEmpty()) {
            return names;
        }
        for (AudienceList list : audienceListRepository.findAllById(ids)) {
            if (workspaceId.equals(list.getWorkspaceId())) {
                names.put(list.getId(), list.getName());
            }
        }
        return names;
    }

    private Map<UUID, String> loadSegmentNames(UUID workspaceId, List<Campaign> campaigns) {
        Set<UUID> ids = new HashSet<>();
        for (Campaign campaign : campaigns) {
            ids.addAll(toList(campaign.getSegmentIds()));
        }
        Map<UUID, String> names = new HashMap<>();
        if (ids.isEmpty()) {
            return names;
        }
        for (AudienceSegment segment : audienceSegmentRepository.findAllById(ids)) {
            if (workspaceId.equals(segment.getWorkspaceId())) {
                names.put(segment.getId(), segment.getName());
            }
        }
        return names;
    }

    private CampaignStatus parseOptionalStatus(String raw) {
        if (raw == null || raw.isBlank() || "all".equalsIgnoreCase(raw.trim())) {
            return null;
        }
        try {
            return CampaignStatus.fromApi(raw);
        } catch (IllegalArgumentException ex) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CAMPAIGN_STATUS_INVALID",
                    "Trạng thái chiến dịch không hợp lệ.");
        }
    }

    private static UUID[] toArray(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return new UUID[0];
        }
        return ids.stream().filter(Objects::nonNull).distinct().toArray(UUID[]::new);
    }

    private static List<UUID> toList(UUID[] ids) {
        if (ids == null || ids.length == 0) {
            return new ArrayList<>();
        }
        return new ArrayList<>(Arrays.asList(ids));
    }

    private static String toLike(String q) {
        if (q == null || q.isBlank()) {
            return "";
        }
        return "%" + q.trim().toLowerCase(Locale.ROOT).replace("%", "\\%").replace("_", "\\_") + "%";
    }

    private static String requireName(String name) {
        String trimmed = name == null ? "" : name.trim();
        if (trimmed.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CAMPAIGN_NAME_REQUIRED",
                    "Vui lòng nhập tên chiến dịch.");
        }
        return trimmed;
    }

    private static String requireSubject(String subject) {
        String trimmed = subject == null ? "" : subject.trim();
        if (trimmed.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CAMPAIGN_SUBJECT_REQUIRED",
                    "Vui lòng nhập tiêu đề email.");
        }
        return trimmed;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String displayName(User user) {
        String first = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String last = user.getLastName() == null ? "" : user.getLastName().trim();
        String full = (first + " " + last).trim();
        if (!full.isEmpty()) {
            return full;
        }
        return user.getEmail();
    }
}
