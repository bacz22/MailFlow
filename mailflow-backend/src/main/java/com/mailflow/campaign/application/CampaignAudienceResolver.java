package com.mailflow.campaign.application;

import com.mailflow.audiencelist.domain.model.AudienceListMember;
import com.mailflow.audiencelist.domain.repository.AudienceListMemberRepository;
import com.mailflow.audiencesegment.application.SegmentMatchQueryService;
import com.mailflow.audiencesegment.domain.model.AudienceSegment;
import com.mailflow.audiencesegment.domain.repository.AudienceSegmentRepository;
import com.mailflow.campaign.domain.model.Campaign;
import com.mailflow.contact.domain.model.Contact;
import com.mailflow.contact.domain.model.ContactStatus;
import com.mailflow.contact.domain.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CampaignAudienceResolver {

    private static final int SEGMENT_PAGE_SIZE = 500;

    private final AudienceListMemberRepository audienceListMemberRepository;
    private final AudienceSegmentRepository audienceSegmentRepository;
    private final SegmentMatchQueryService matchQueryService;
    private final ContactRepository contactRepository;

    /**
     * Unique ACTIVE contacts from lists ∪ segments minus excluded list members.
     * Dedup by contact id (email normalized as secondary key).
     */
    public List<Contact> resolveActiveRecipients(Campaign campaign) {
        UUID workspaceId = campaign.getWorkspaceId();
        Map<UUID, Contact> included = new LinkedHashMap<>();

        collectFromLists(workspaceId, campaign.getListIds(), included);
        collectFromSegments(workspaceId, campaign.getSegmentIds(), included);

        Set<UUID> excludedIds = collectExcludedContactIds(campaign.getExcludedListIds());
        if (!excludedIds.isEmpty()) {
            included.keySet().removeAll(excludedIds);
        }

        List<Contact> result = new ArrayList<>();
        Set<String> seenEmails = new HashSet<>();
        for (Contact contact : included.values()) {
            if (contact.getStatus() != ContactStatus.ACTIVE) {
                continue;
            }
            String email = contact.getEmail() == null ? "" : contact.getEmail().trim().toLowerCase(Locale.ROOT);
            if (email.isBlank() || !seenEmails.add(email)) {
                continue;
            }
            result.add(contact);
        }
        return result;
    }

    private void collectFromLists(UUID workspaceId, UUID[] listIds, Map<UUID, Contact> included) {
        if (listIds == null || listIds.length == 0) {
            return;
        }
        Set<UUID> contactIds = new HashSet<>();
        for (UUID listId : listIds) {
            for (AudienceListMember member : audienceListMemberRepository.findByListId(listId)) {
                contactIds.add(member.getContactId());
            }
        }
        if (contactIds.isEmpty()) {
            return;
        }
        for (Contact contact : contactRepository.findByWorkspaceIdAndIdIn(workspaceId, contactIds)) {
            included.putIfAbsent(contact.getId(), contact);
        }
    }

    private void collectFromSegments(UUID workspaceId, UUID[] segmentIds, Map<UUID, Contact> included) {
        if (segmentIds == null || segmentIds.length == 0) {
            return;
        }
        for (UUID segmentId : segmentIds) {
            AudienceSegment segment = audienceSegmentRepository.findByIdAndWorkspaceId(segmentId, workspaceId)
                    .orElse(null);
            if (segment == null) {
                continue;
            }
            int page = 0;
            while (true) {
                Page<Contact> slice = matchQueryService.findPage(
                        workspaceId,
                        segment.getMatchLogic(),
                        segment.getConditions(),
                        null,
                        ContactStatus.ACTIVE.name(),
                        PageRequest.of(page, SEGMENT_PAGE_SIZE)
                );
                for (Contact contact : slice.getContent()) {
                    included.putIfAbsent(contact.getId(), contact);
                }
                if (!slice.hasNext()) {
                    break;
                }
                page++;
            }
        }
    }

    private Set<UUID> collectExcludedContactIds(UUID[] excludedListIds) {
        Set<UUID> excluded = new HashSet<>();
        if (excludedListIds == null || excludedListIds.length == 0) {
            return excluded;
        }
        for (UUID listId : excludedListIds) {
            for (AudienceListMember member : audienceListMemberRepository.findByListId(listId)) {
                excluded.add(member.getContactId());
            }
        }
        return excluded;
    }
}
