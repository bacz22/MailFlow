package com.mailflow.audiencesegment.application;

import com.mailflow.audiencelist.application.AudienceListService;
import com.mailflow.audiencesegment.api.request.CreateAudienceSegmentRequest;
import com.mailflow.audiencesegment.api.request.PreviewAudienceSegmentRequest;
import com.mailflow.audiencesegment.api.request.UpdateAudienceSegmentRequest;
import com.mailflow.audiencesegment.api.response.AudienceSegmentResponse;
import com.mailflow.audiencesegment.domain.model.AudienceSegment;
import com.mailflow.audiencesegment.domain.model.SegmentCondition;
import com.mailflow.audiencesegment.domain.repository.AudienceSegmentRepository;
import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.contact.api.response.ContactPageResponse;
import com.mailflow.contact.api.response.ContactResponse;
import com.mailflow.contact.domain.model.Contact;
import com.mailflow.contact.domain.model.ContactStatus;
import com.mailflow.contact.domain.repository.ContactRepository;
import com.mailflow.workspace.application.WorkspaceAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AudienceSegmentService {

    private final AudienceSegmentRepository segmentRepository;
    private final SegmentMatchQueryService matchQueryService;
    private final SegmentRuleEvaluator ruleEvaluator;
    private final ContactRepository contactRepository;
    private final AudienceListService audienceListService;
    private final WorkspaceAccessService accessService;

    @Transactional(readOnly = true)
    public List<AudienceSegmentResponse> list(UUID userId, UUID workspaceId, String q) {
        accessService.requireSegmentRead(userId, workspaceId);
        List<AudienceSegment> segments;
        if (q == null || q.isBlank()) {
            segments = segmentRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        } else {
            String like = "%" + q.trim().toLowerCase(Locale.ROOT).replace("%", "\\%").replace("_", "\\_") + "%";
            segments = segmentRepository.search(workspaceId, like);
        }
        return segments.stream().map(segment -> toResponse(segment, workspaceId)).toList();
    }

    @Transactional(readOnly = true)
    public AudienceSegmentResponse get(UUID userId, UUID workspaceId, UUID segmentId) {
        accessService.requireSegmentRead(userId, workspaceId);
        return toResponse(requireSegment(workspaceId, segmentId), workspaceId);
    }

    @Transactional
    public AudienceSegmentResponse create(UUID userId, UUID workspaceId, CreateAudienceSegmentRequest request) {
        accessService.requireSegmentWrite(userId, workspaceId);
        String name = request.getName().trim();
        if (segmentRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, name)) {
            throw new AppException(HttpStatus.CONFLICT, "SEGMENT_NAME_EXISTS",
                    "Phân đoạn \"" + name + "\" đã tồn tại trong workspace.");
        }
        AudienceSegment.MatchLogic matchLogic = parseMatchLogic(request.getMatchLogic());
        List<SegmentCondition> conditions = normalizeConditions(request.getConditions());
        ruleEvaluator.validate(conditions);
        AudienceSegment segment = new AudienceSegment(
                workspaceId,
                name,
                blankToNull(request.getDescription()),
                matchLogic,
                conditions
        );
        segment = segmentRepository.save(segment);
        return toResponse(segment, workspaceId);
    }

    @Transactional
    public AudienceSegmentResponse update(
            UUID userId,
            UUID workspaceId,
            UUID segmentId,
            UpdateAudienceSegmentRequest request
    ) {
        accessService.requireSegmentWrite(userId, workspaceId);
        AudienceSegment segment = requireSegment(workspaceId, segmentId);
        if (request.getName() != null) {
            String name = request.getName().trim();
            if (name.isEmpty()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_NAME_REQUIRED",
                        "Vui lòng nhập tên phân đoạn.");
            }
            if (!segment.getName().equalsIgnoreCase(name)
                    && segmentRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, name)) {
                throw new AppException(HttpStatus.CONFLICT, "SEGMENT_NAME_EXISTS",
                        "Phân đoạn \"" + name + "\" đã tồn tại trong workspace.");
            }
        }
        AudienceSegment.MatchLogic matchLogic = request.getMatchLogic() == null
                ? null
                : parseMatchLogic(request.getMatchLogic());
        List<SegmentCondition> conditions = request.getConditions() == null
                ? null
                : normalizeConditions(request.getConditions());
        if (conditions != null) {
            ruleEvaluator.validate(conditions);
        }
        segment.apply(
                request.getName() == null ? null : request.getName().trim(),
                request.getDescription(),
                matchLogic,
                conditions
        );
        return toResponse(segment, workspaceId);
    }

    @Transactional
    public void delete(UUID userId, UUID workspaceId, UUID segmentId) {
        accessService.requireSegmentDelete(userId, workspaceId);
        AudienceSegment segment = requireSegment(workspaceId, segmentId);
        segmentRepository.delete(segment);
    }

    @Transactional
    public AudienceSegmentResponse duplicate(UUID userId, UUID workspaceId, UUID segmentId) {
        accessService.requireSegmentWrite(userId, workspaceId);
        AudienceSegment source = requireSegment(workspaceId, segmentId);
        String copyName = nextDuplicateName(workspaceId, source.getName());
        AudienceSegment copy = new AudienceSegment(
                workspaceId,
                copyName,
                source.getDescription(),
                source.getMatchLogic(),
                source.getConditions() == null ? List.of() : new ArrayList<>(source.getConditions())
        );
        copy = segmentRepository.save(copy);
        return toResponse(copy, workspaceId);
    }

    @Transactional(readOnly = true)
    public ContactPageResponse listContacts(
            UUID userId,
            UUID workspaceId,
            UUID segmentId,
            String q,
            String status,
            Integer page,
            Integer size
    ) {
        accessService.requireSegmentRead(userId, workspaceId);
        AudienceSegment segment = requireSegment(workspaceId, segmentId);
        return pageMatchedContacts(
                workspaceId,
                segment.getMatchLogic(),
                segment.getConditions(),
                q,
                status,
                page,
                size
        );
    }

    @Transactional(readOnly = true)
    public ContactPageResponse preview(UUID userId, UUID workspaceId, PreviewAudienceSegmentRequest request) {
        accessService.requireSegmentRead(userId, workspaceId);
        AudienceSegment.MatchLogic matchLogic = parseMatchLogic(request.getMatchLogic());
        List<SegmentCondition> conditions = normalizeConditions(request.getConditions());
        ruleEvaluator.validate(conditions);
        return pageMatchedContacts(
                workspaceId,
                matchLogic,
                conditions,
                null,
                null,
                request.getPage(),
                request.getSize()
        );
    }

    @Transactional(readOnly = true)
    public ContactPageResponse listContactsBySegmentRules(
            UUID workspaceId,
            UUID segmentId,
            String q,
            String status,
            Integer page,
            Integer size,
            String sortIgnored
    ) {
        AudienceSegment segment = requireSegment(workspaceId, segmentId);
        return pageMatchedContacts(
                workspaceId,
                segment.getMatchLogic(),
                segment.getConditions(),
                q,
                status,
                page,
                size
        );
    }

    public AudienceSegment requireSegment(UUID workspaceId, UUID segmentId) {
        return segmentRepository.findByIdAndWorkspaceId(segmentId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Segment", segmentId.toString()));
    }

    private ContactPageResponse pageMatchedContacts(
            UUID workspaceId,
            AudienceSegment.MatchLogic matchLogic,
            List<SegmentCondition> conditions,
            String q,
            String status,
            Integer page,
            Integer size
    ) {
        String statusFilter = "";
        if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
            try {
                statusFilter = ContactStatus.valueOf(status.trim().toUpperCase(Locale.ROOT)).name();
            } catch (IllegalArgumentException ex) {
                throw new AppException(HttpStatus.BAD_REQUEST, "CONTACT_INVALID_STATUS",
                        "Trạng thái liên hệ không hợp lệ.");
            }
        }
        String qLike = "";
        if (q != null && !q.isBlank()) {
            qLike = "%" + q.trim().toLowerCase(Locale.ROOT).replace("%", "\\%").replace("_", "\\_") + "%";
        }
        int pageIndex = page == null || page < 0 ? 0 : page;
        int pageSize = size == null || size <= 0 ? 10 : Math.min(size, 50);
        Pageable pageable = PageRequest.of(pageIndex, pageSize);
        Page<Contact> result = matchQueryService.findPage(
                workspaceId,
                matchLogic,
                conditions,
                qLike.isEmpty() ? null : qLike,
                statusFilter.isEmpty() ? null : statusFilter,
                pageable
        );
        Map<UUID, AudienceListService.ListMembership> memberships = audienceListService.membershipsFor(
                result.getContent().stream().map(Contact::getId).toList()
        );
        List<ContactResponse> content = result.getContent().stream()
                .map(contact -> AudienceListService.toContactResponse(contact, memberships.get(contact.getId())))
                .toList();
        return ContactPageResponse.builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .availableTags(contactRepository.findDistinctTags(workspaceId))
                .build();
    }

    private AudienceSegmentResponse toResponse(AudienceSegment segment, UUID workspaceId) {
        long contactCount = 0L;
        if (segment.getConditions() != null && !segment.getConditions().isEmpty()) {
            try {
                contactCount = matchQueryService.count(workspaceId, segment.getMatchLogic(), segment.getConditions());
            } catch (AppException ignored) {
                contactCount = 0L;
            }
        }
        return AudienceSegmentResponse.builder()
                .id(segment.getId())
                .name(segment.getName())
                .description(segment.getDescription() == null ? "" : segment.getDescription())
                .matchLogic(segment.getMatchLogic().name().toLowerCase(Locale.ROOT))
                .conditions(segment.getConditions() == null ? List.of() : segment.getConditions())
                .contactCount(contactCount)
                .createdAt(segment.getCreatedAt())
                .updatedAt(segment.getUpdatedAt())
                .build();
    }

    private AudienceSegment.MatchLogic parseMatchLogic(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_MATCH_LOGIC_INVALID",
                    "Logic khớp không hợp lệ.");
        }
        try {
            return AudienceSegment.MatchLogic.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_MATCH_LOGIC_INVALID",
                    "Logic khớp không hợp lệ.");
        }
    }

    private List<SegmentCondition> normalizeConditions(List<SegmentCondition> incoming) {
        List<SegmentCondition> cleaned = new ArrayList<>();
        int i = 0;
        for (SegmentCondition condition : incoming) {
            if (condition == null) {
                continue;
            }
            SegmentCondition copy = new SegmentCondition(
                    condition.getId() == null || condition.getId().isBlank() ? "c-" + (++i) : condition.getId(),
                    condition.getField() == null ? null : condition.getField().trim(),
                    condition.getOperator() == null ? null : condition.getOperator().trim(),
                    condition.getValue(),
                    condition.getFieldType()
            );
            cleaned.add(copy);
        }
        return cleaned;
    }

    private String nextDuplicateName(UUID workspaceId, String sourceName) {
        String candidate = sourceName + " (Bản sao)";
        int n = 2;
        while (segmentRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, candidate)) {
            candidate = sourceName + " (Bản sao " + n + ")";
            n++;
        }
        return candidate;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
