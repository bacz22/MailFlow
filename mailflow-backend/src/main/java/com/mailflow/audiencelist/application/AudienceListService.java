package com.mailflow.audiencelist.application;

import com.mailflow.audiencelist.api.request.AddListMembersRequest;
import com.mailflow.audiencelist.api.request.CreateAudienceListRequest;
import com.mailflow.audiencelist.api.request.UpdateAudienceListRequest;
import com.mailflow.audiencelist.api.response.AddedMembersResponse;
import com.mailflow.audiencelist.api.response.AudienceListResponse;
import com.mailflow.audiencelist.domain.model.AudienceList;
import com.mailflow.audiencelist.domain.model.AudienceListMember;
import com.mailflow.audiencelist.domain.repository.AudienceListMemberRepository;
import com.mailflow.audiencelist.domain.repository.AudienceListRepository;
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
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AudienceListService {

    private final AudienceListRepository listRepository;
    private final AudienceListMemberRepository memberRepository;
    private final ContactRepository contactRepository;
    private final WorkspaceAccessService accessService;

    @Transactional(readOnly = true)
    public List<AudienceListResponse> list(UUID userId, UUID workspaceId, String q) {
        accessService.requireListRead(userId, workspaceId);
        List<AudienceList> lists;
        if (q == null || q.isBlank()) {
            lists = listRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        } else {
            String like = "%" + q.trim().toLowerCase(Locale.ROOT).replace("%", "\\%").replace("_", "\\_") + "%";
            lists = listRepository.search(workspaceId, like);
        }
        Map<UUID, long[]> counts = loadCounts(lists.stream().map(AudienceList::getId).toList());
        return lists.stream().map(list -> toResponse(list, counts)).toList();
    }

    @Transactional(readOnly = true)
    public AudienceListResponse get(UUID userId, UUID workspaceId, UUID listId) {
        accessService.requireListRead(userId, workspaceId);
        AudienceList list = requireList(workspaceId, listId);
        Map<UUID, long[]> counts = loadCounts(List.of(listId));
        return toResponse(list, counts);
    }

    @Transactional(readOnly = true)
    public ContactPageResponse listContacts(
            UUID userId,
            UUID workspaceId,
            UUID listId,
            String q,
            String status,
            Integer page,
            Integer size
    ) {
        accessService.requireListRead(userId, workspaceId);
        requireList(workspaceId, listId);
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
        Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "created_at"));
        Page<Contact> result = contactRepository.search(
                workspaceId,
                statusFilter,
                "",
                qLike,
                listId.toString(),
                pageable
        );
        Map<UUID, ListMembership> memberships = membershipsFor(
                result.getContent().stream().map(Contact::getId).toList()
        );
        List<ContactResponse> content = result.getContent().stream()
                .map(contact -> toContactResponse(contact, memberships.get(contact.getId())))
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

    @Transactional
    public AudienceListResponse create(UUID userId, UUID workspaceId, CreateAudienceListRequest request) {
        accessService.requireListWrite(userId, workspaceId);
        String name = request.getName().trim();
        assertNameAvailable(workspaceId, name);
        AudienceList list = new AudienceList(workspaceId, name, blankToNull(request.getDescription()));
        list.replaceTags(request.getTags());
        list = listRepository.save(list);
        return toResponse(list, Map.of());
    }

    @Transactional
    public AudienceListResponse update(
            UUID userId,
            UUID workspaceId,
            UUID listId,
            UpdateAudienceListRequest request
    ) {
        accessService.requireListWrite(userId, workspaceId);
        AudienceList list = requireList(workspaceId, listId);
        if (request.getName() != null) {
            String name = request.getName().trim();
            if (name.isBlank()) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR",
                        "Vui lòng nhập tên danh sách.");
            }
            if (!name.equalsIgnoreCase(list.getName())) {
                assertNameAvailable(workspaceId, name);
            }
            list.apply(name, request.getDescription(), request.getTags());
        } else {
            list.apply(null, request.getDescription(), request.getTags());
        }
        Map<UUID, long[]> counts = loadCounts(List.of(listId));
        return toResponse(list, counts);
    }

    @Transactional
    public void delete(UUID userId, UUID workspaceId, UUID listId) {
        accessService.requireListDelete(userId, workspaceId);
        AudienceList list = requireList(workspaceId, listId);
        listRepository.delete(list);
    }

    @Transactional
    public AudienceListResponse duplicate(UUID userId, UUID workspaceId, UUID listId) {
        accessService.requireListWrite(userId, workspaceId);
        AudienceList source = requireList(workspaceId, listId);
        String copyName = uniqueCopyName(workspaceId, source.getName());
        AudienceList copy = new AudienceList(workspaceId, copyName, source.getDescription());
        copy.replaceTags(source.tagList());
        copy = listRepository.save(copy);
        UUID copyId = copy.getId();
        for (AudienceListMember member : memberRepository.findByListId(listId)) {
            memberRepository.save(new AudienceListMember(copyId, member.getContactId()));
        }
        Map<UUID, long[]> counts = loadCounts(List.of(copyId));
        return toResponse(copy, counts);
    }

    @Transactional
    public AddedMembersResponse addMembers(
            UUID userId,
            UUID workspaceId,
            UUID listId,
            AddListMembersRequest request
    ) {
        accessService.requireListWrite(userId, workspaceId);
        requireList(workspaceId, listId);
        int added = addMembersInternal(workspaceId, listId, request.getIds());
        return new AddedMembersResponse(added);
    }

    @Transactional
    public void removeMember(UUID userId, UUID workspaceId, UUID listId, UUID contactId) {
        accessService.requireListWrite(userId, workspaceId);
        requireList(workspaceId, listId);
        memberRepository.deleteByListIdAndContactId(listId, contactId);
    }

    @Transactional
    public AddedMembersResponse bulkAddContacts(UUID userId, UUID workspaceId, UUID listId, List<UUID> contactIds) {
        accessService.requireListWrite(userId, workspaceId);
        requireList(workspaceId, listId);
        int added = addMembersInternal(workspaceId, listId, contactIds);
        return new AddedMembersResponse(added);
    }

    public int addMembersInternal(UUID workspaceId, UUID listId, Collection<UUID> contactIds) {
        if (contactIds == null || contactIds.isEmpty()) {
            return 0;
        }
        List<Contact> contacts = contactRepository.findByWorkspaceIdAndIdIn(workspaceId, contactIds);
        int added = 0;
        for (Contact contact : contacts) {
            if (!memberRepository.existsByListIdAndContactId(listId, contact.getId())) {
                memberRepository.save(new AudienceListMember(listId, contact.getId()));
                added++;
            }
        }
        return added;
    }

    public void replaceContactLists(UUID workspaceId, UUID contactId, List<UUID> listIds) {
        memberRepository.deleteByContactId(contactId);
        if (listIds == null || listIds.isEmpty()) {
            return;
        }
        for (UUID listId : listIds) {
            AudienceList list = requireList(workspaceId, listId);
            if (!memberRepository.existsByListIdAndContactId(list.getId(), contactId)) {
                memberRepository.save(new AudienceListMember(list.getId(), contactId));
            }
        }
    }

    public void assignContactToList(UUID workspaceId, UUID listId, UUID contactId) {
        requireList(workspaceId, listId);
        if (!memberRepository.existsByListIdAndContactId(listId, contactId)) {
            memberRepository.save(new AudienceListMember(listId, contactId));
        }
    }

    public Map<UUID, ListMembership> membershipsFor(Collection<UUID> contactIds) {
        Map<UUID, ListMembership> result = new HashMap<>();
        if (contactIds == null || contactIds.isEmpty()) {
            return result;
        }
        for (Object[] row : memberRepository.findListNamesByContactIds(contactIds)) {
            UUID contactId = toUuid(row[0]);
            String name = row[1] == null ? "" : row[1].toString();
            UUID listId = toUuid(row[2]);
            ListMembership membership = result.computeIfAbsent(contactId, ignored -> new ListMembership());
            membership.names.add(name);
            membership.ids.add(listId);
        }
        return result;
    }

    public AudienceList requireList(UUID workspaceId, UUID listId) {
        return listRepository.findByIdAndWorkspaceId(listId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Danh sách", listId.toString()));
    }

    private void assertNameAvailable(UUID workspaceId, String name) {
        if (listRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, name)) {
            throw new AppException(HttpStatus.CONFLICT, "LIST_NAME_EXISTS",
                    "Tên danh sách đã tồn tại trong workspace.");
        }
    }

    private String uniqueCopyName(UUID workspaceId, String sourceName) {
        String first = sourceName + " (Bản sao)";
        if (!listRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, first)) {
            return first;
        }
        int n = 2;
        String candidate;
        do {
            candidate = sourceName + " (Bản sao " + n + ")";
            n++;
        } while (listRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, candidate));
        return candidate;
    }

    private Map<UUID, long[]> loadCounts(List<UUID> listIds) {
        Map<UUID, long[]> counts = new LinkedHashMap<>();
        if (listIds == null || listIds.isEmpty()) {
            return counts;
        }
        for (Object[] row : memberRepository.countMembersByListIds(listIds)) {
            UUID listId = toUuid(row[0]);
            counts.put(listId, new long[]{
                    toLong(row[1]),
                    toLong(row[2]),
                    toLong(row[3])
            });
        }
        return counts;
    }

    private AudienceListResponse toResponse(AudienceList list, Map<UUID, long[]> counts) {
        long[] c = counts.getOrDefault(list.getId(), new long[]{0, 0, 0});
        return AudienceListResponse.builder()
                .id(list.getId())
                .name(list.getName())
                .description(list.getDescription() == null ? "" : list.getDescription())
                .contactCount(c[0])
                .activeCount(c[1])
                .unsubscribedCount(c[2])
                .tags(list.tagList())
                .createdAt(list.getCreatedAt())
                .updatedAt(list.getUpdatedAt())
                .build();
    }

    public static ContactResponse toContactResponse(Contact contact, ListMembership membership) {
        List<String> names = membership == null ? List.of() : membership.names();
        List<UUID> ids = membership == null ? List.of() : membership.ids();
        return ContactResponse.builder()
                .id(contact.getId())
                .firstName(contact.getFirstName())
                .lastName(contact.getLastName())
                .fullName(contact.fullName())
                .email(contact.getEmail())
                .company(contact.getCompany())
                .phone(contact.getPhone())
                .lists(names)
                .listIds(ids)
                .tags(contact.tagList())
                .status(contact.getStatus())
                .customFields(contact.getCustomFields() == null ? List.of() : contact.getCustomFields())
                .createdAt(contact.getCreatedAt())
                .updatedAt(contact.getUpdatedAt())
                .build();
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private UUID toUuid(Object value) {
        if (value instanceof UUID uuid) {
            return uuid;
        }
        return UUID.fromString(value.toString());
    }

    private long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return value == null ? 0L : Long.parseLong(value.toString());
    }

    public static final class ListMembership {
        private final List<String> names = new ArrayList<>();
        private final List<UUID> ids = new ArrayList<>();

        public List<String> names() {
            return names;
        }

        public List<UUID> ids() {
            return ids;
        }
    }
}
