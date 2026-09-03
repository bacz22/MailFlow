package com.mailflow.contact.application;

import com.mailflow.audiencelist.api.request.BulkListsRequest;
import com.mailflow.audiencelist.api.response.AddedMembersResponse;
import com.mailflow.audiencelist.application.AudienceListService;
import com.mailflow.audiencesegment.application.AudienceSegmentService;
import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.contact.api.request.BulkIdsRequest;
import com.mailflow.contact.api.request.BulkTagsRequest;
import com.mailflow.contact.api.request.CreateContactRequest;
import com.mailflow.contact.api.request.ExportContactsRequest;
import com.mailflow.contact.api.request.ImportContactsRequest;
import com.mailflow.contact.api.request.UpdateContactRequest;
import com.mailflow.contact.api.response.BulkDeleteResponse;
import com.mailflow.contact.api.response.ContactPageResponse;
import com.mailflow.contact.api.response.ContactResponse;
import com.mailflow.contact.api.response.ContactStatsResponse;
import com.mailflow.contact.api.response.ImportContactsResponse;
import com.mailflow.contact.domain.model.Contact;
import com.mailflow.contact.domain.model.ContactCustomField;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ContactService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_IMPORT_ROWS = 5000;
    private static final int MAX_IMPORT_ERRORS = 50;
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$",
            Pattern.CASE_INSENSITIVE
    );
    private static final Map<String, String> SORT_COLUMNS = Map.of(
            "createdAt", "created_at",
            "updatedAt", "updated_at",
            "email", "email",
            "firstName", "first_name",
            "lastName", "last_name",
            "fullName", "last_name",
            "company", "company",
            "status", "status"
    );

    private final ContactRepository contactRepository;
    private final WorkspaceAccessService accessService;
    private final AudienceListService audienceListService;
    private final AudienceSegmentService audienceSegmentService;

    @Transactional(readOnly = true)
    public ContactPageResponse list(
            UUID userId,
            UUID workspaceId,
            String q,
            String status,
            String tag,
            Integer page,
            Integer size,
            String sort
    ) {
        return list(userId, workspaceId, q, status, tag, page, size, sort, null, null);
    }

    @Transactional(readOnly = true)
    public ContactPageResponse list(
            UUID userId,
            UUID workspaceId,
            String q,
            String status,
            String tag,
            Integer page,
            Integer size,
            String sort,
            String listId
    ) {
        return list(userId, workspaceId, q, status, tag, page, size, sort, listId, null);
    }

    @Transactional(readOnly = true)
    public ContactPageResponse list(
            UUID userId,
            UUID workspaceId,
            String q,
            String status,
            String tag,
            Integer page,
            Integer size,
            String sort,
            String listId,
            String segmentId
    ) {
        accessService.requireContactRead(userId, workspaceId);
        if (segmentId != null && !segmentId.isBlank()) {
            UUID segmentUuid;
            try {
                segmentUuid = UUID.fromString(segmentId.trim());
            } catch (IllegalArgumentException ex) {
                throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_INVALID_ID",
                        "ID phân đoạn không hợp lệ.");
            }
            return audienceSegmentService.listContactsBySegmentRules(
                    workspaceId, segmentUuid, q, status, page, size, sort
            );
        }
        Pageable pageable = toPageable(page, size, sort);
        Page<Contact> result = contactRepository.search(
                workspaceId,
                normalizeStatusFilter(status),
                blankToEmpty(tag),
                toSearchLike(q),
                blankToEmpty(listId),
                pageable
        );
        Map<UUID, AudienceListService.ListMembership> memberships = audienceListService.membershipsFor(
                result.getContent().stream().map(Contact::getId).toList()
        );
        return ContactPageResponse.builder()
                .content(result.getContent().stream()
                        .map(contact -> AudienceListService.toContactResponse(contact, memberships.get(contact.getId())))
                        .toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .availableTags(contactRepository.findDistinctTags(workspaceId))
                .build();
    }

    @Transactional(readOnly = true)
    public ContactStatsResponse stats(UUID userId, UUID workspaceId) {
        accessService.requireContactRead(userId, workspaceId);
        Map<ContactStatus, Long> counts = new LinkedHashMap<>();
        for (Object[] row : contactRepository.countGroupedByStatus(workspaceId)) {
            counts.put((ContactStatus) row[0], (Long) row[1]);
        }
        long total = contactRepository.countByWorkspaceId(workspaceId);
        return ContactStatsResponse.builder()
                .total(total)
                .active(counts.getOrDefault(ContactStatus.ACTIVE, 0L))
                .unsubscribed(counts.getOrDefault(ContactStatus.UNSUBSCRIBED, 0L))
                .bounced(counts.getOrDefault(ContactStatus.BOUNCED, 0L))
                .invalid(counts.getOrDefault(ContactStatus.INVALID, 0L))
                .blocked(counts.getOrDefault(ContactStatus.BLOCKED, 0L))
                .build();
    }

    @Transactional(readOnly = true)
    public ContactResponse get(UUID userId, UUID workspaceId, UUID contactId) {
        accessService.requireContactRead(userId, workspaceId);
        return toResponse(requireContact(workspaceId, contactId));
    }

    @Transactional
    public ContactResponse create(UUID userId, UUID workspaceId, CreateContactRequest request) {
        accessService.requireContactWrite(userId, workspaceId);
        String email = normalizeEmail(request.getEmail());
        assertEmailAvailable(workspaceId, email, null);
        Contact contact = new Contact(workspaceId, email, request.getFirstName().trim(), request.getLastName().trim());
        contact.applyProfile(
                request.getFirstName().trim(),
                request.getLastName().trim(),
                email,
                request.getPhone(),
                request.getCompany(),
                request.getStatus() == null ? ContactStatus.ACTIVE : request.getStatus(),
                request.getTags(),
                request.getCustomFields()
        );
        Contact saved = contactRepository.save(contact);
        if (request.getListIds() != null && !request.getListIds().isEmpty()) {
            audienceListService.replaceContactLists(workspaceId, saved.getId(), request.getListIds());
        }
        return toResponse(saved);
    }

    @Transactional
    public ContactResponse update(UUID userId, UUID workspaceId, UUID contactId, UpdateContactRequest request) {
        accessService.requireContactWrite(userId, workspaceId);
        Contact contact = requireContact(workspaceId, contactId);
        String email = request.getEmail() == null ? null : normalizeEmail(request.getEmail());
        if (email != null) {
            assertEmailAvailable(workspaceId, email, contactId);
        }
        String firstName = request.getFirstName() == null ? null : request.getFirstName().trim();
        String lastName = request.getLastName() == null ? null : request.getLastName().trim();
        if (firstName != null && firstName.isBlank()) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", "Vui lòng nhập tên.");
        }
        if (lastName != null && lastName.isBlank()) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", "Vui lòng nhập họ và tên đệm.");
        }
        contact.applyProfile(
                firstName,
                lastName,
                email,
                request.getPhone(),
                request.getCompany(),
                request.getStatus(),
                request.getTags(),
                request.getCustomFields()
        );
        if (request.getListIds() != null) {
            audienceListService.replaceContactLists(workspaceId, contactId, request.getListIds());
        }
        return toResponse(contact);
    }

    @Transactional
    public void delete(UUID userId, UUID workspaceId, UUID contactId) {
        accessService.requireContactDelete(userId, workspaceId);
        Contact contact = requireContact(workspaceId, contactId);
        contactRepository.delete(contact);
    }

    @Transactional
    public BulkDeleteResponse bulkDelete(UUID userId, UUID workspaceId, BulkIdsRequest request) {
        accessService.requireContactDelete(userId, workspaceId);
        long deleted = contactRepository.deleteByWorkspaceIdAndIdIn(workspaceId, request.getIds());
        return new BulkDeleteResponse(deleted);
    }

    @Transactional
    public int bulkTags(UUID userId, UUID workspaceId, BulkTagsRequest request) {
        accessService.requireContactWrite(userId, workspaceId);
        List<Contact> contacts = contactRepository.findByWorkspaceIdAndIdIn(workspaceId, request.getIds());
        for (Contact contact : contacts) {
            contact.mergeTags(request.getTags());
        }
        return contacts.size();
    }

    @Transactional
    public AddedMembersResponse bulkLists(UUID userId, UUID workspaceId, BulkListsRequest request) {
        accessService.requireContactWrite(userId, workspaceId);
        return audienceListService.bulkAddContacts(userId, workspaceId, request.getListId(), request.getIds());
    }

    @Transactional
    public ImportContactsResponse importContacts(UUID userId, UUID workspaceId, ImportContactsRequest request) {
        accessService.requireContactImport(userId, workspaceId);
        if (request.getListId() != null) {
            audienceListService.requireList(workspaceId, request.getListId());
        }
        List<ImportContactsRequest.ImportContactRow> rows = request.getRows();
        if (rows.size() > MAX_IMPORT_ROWS) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CONTACT_IMPORT_TOO_LARGE",
                    "Mỗi lần nạp tối đa " + MAX_IMPORT_ROWS + " dòng.");
        }
        ImportContactsRequest.DuplicateAction duplicateAction = request.getDuplicateAction() == null
                ? ImportContactsRequest.DuplicateAction.SKIP
                : request.getDuplicateAction();
        List<String> importTags = request.getTags();
        int created = 0;
        int updated = 0;
        int skipped = 0;
        int invalid = 0;
        List<ImportContactsResponse.ImportError> errors = new ArrayList<>();

        for (int i = 0; i < rows.size(); i++) {
            ImportContactsRequest.ImportContactRow row = rows.get(i);
            int rowNumber = i + 1;
            String email = row.getEmail() == null ? "" : row.getEmail().trim();
            if (email.isBlank() || !EMAIL_PATTERN.matcher(email).matches()) {
                invalid++;
                addImportError(errors, rowNumber, email, "Email không hợp lệ hoặc bị thiếu.");
                continue;
            }
            String firstName = blankToFallback(row.getFirstName(), "—");
            String lastName = blankToFallback(row.getLastName(), "—");
            if (firstName.length() > 50) {
                firstName = firstName.substring(0, 50);
            }
            if (lastName.length() > 50) {
                lastName = lastName.substring(0, 50);
            }
            Optional<Contact> existing = contactRepository.findByWorkspaceIdAndEmailIgnoreCase(workspaceId, email);
            if (existing.isPresent()) {
                if (duplicateAction == ImportContactsRequest.DuplicateAction.SKIP) {
                    skipped++;
                    if (request.getListId() != null) {
                        audienceListService.assignContactToList(workspaceId, request.getListId(), existing.get().getId());
                    }
                    continue;
                }
                Contact contact = existing.get();
                contact.applyProfile(
                        firstName,
                        lastName,
                        normalizeEmail(email),
                        row.getPhone(),
                        row.getCompany(),
                        null,
                        null,
                        emptyToNull(row.getCustomFields())
                );
                contact.mergeTags(importTags);
                if (request.getListId() != null) {
                    audienceListService.assignContactToList(workspaceId, request.getListId(), contact.getId());
                }
                updated++;
                continue;
            }
            Contact contact = new Contact(workspaceId, normalizeEmail(email), firstName, lastName);
            contact.applyProfile(
                    firstName,
                    lastName,
                    normalizeEmail(email),
                    row.getPhone(),
                    row.getCompany(),
                    ContactStatus.ACTIVE,
                    importTags,
                    emptyToNull(row.getCustomFields())
            );
            contactRepository.save(contact);
            if (request.getListId() != null) {
                audienceListService.assignContactToList(workspaceId, request.getListId(), contact.getId());
            }
            created++;
        }

        return ImportContactsResponse.builder()
                .created(created)
                .updated(updated)
                .skipped(skipped)
                .invalid(invalid)
                .errors(errors)
                .build();
    }

    @Transactional(readOnly = true)
    public String exportCsv(
            UUID userId,
            UUID workspaceId,
            String q,
            String status,
            String tag,
            String listId,
            List<UUID> ids
    ) {
        accessService.requireContactExport(userId, workspaceId);
        List<Contact> contacts;
        if (ids != null && !ids.isEmpty()) {
            contacts = contactRepository.findByWorkspaceIdAndIdIn(workspaceId, ids);
        } else {
            contacts = contactRepository.search(
                    workspaceId,
                    normalizeStatusFilter(status),
                    blankToEmpty(tag),
                    toSearchLike(q),
                    blankToEmpty(listId),
                    Pageable.unpaged(Sort.by(Sort.Direction.DESC, "created_at"))
            ).getContent();
        }
        StringBuilder csv = new StringBuilder();
        csv.append('\uFEFF');
        csv.append("email,first_name,last_name,company,phone,status,tags,created_at\n");
        for (Contact contact : contacts) {
            csv.append(csvCell(contact.getEmail())).append(',')
                    .append(csvCell(contact.getFirstName())).append(',')
                    .append(csvCell(contact.getLastName())).append(',')
                    .append(csvCell(contact.getCompany())).append(',')
                    .append(csvCell(contact.getPhone())).append(',')
                    .append(csvCell(contact.getStatus() == null ? "" : contact.getStatus().toJson())).append(',')
                    .append(csvCell(String.join("|", contact.tagList()))).append(',')
                    .append(csvCell(contact.getCreatedAt() == null ? "" : contact.getCreatedAt().toString()))
                    .append('\n');
        }
        return csv.toString();
    }

    @Transactional(readOnly = true)
    public String exportCsv(UUID userId, UUID workspaceId, ExportContactsRequest request) {
        return exportCsv(userId, workspaceId, null, null, null, null, request == null ? null : request.getIds());
    }

    private void assertEmailAvailable(UUID workspaceId, String email, UUID currentId) {
        Optional<Contact> existing = contactRepository.findByWorkspaceIdAndEmailIgnoreCase(workspaceId, email);
        if (existing.isPresent() && (currentId == null || !existing.get().getId().equals(currentId))) {
            throw new AppException(HttpStatus.CONFLICT, "CONTACT_EMAIL_EXISTS",
                    "Email này đã tồn tại trong danh bạ workspace.");
        }
    }

    private Contact requireContact(UUID workspaceId, UUID contactId) {
        return contactRepository.findByIdAndWorkspaceId(contactId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Liên hệ", contactId.toString()));
    }

    private ContactResponse toResponse(Contact contact) {
        Map<UUID, AudienceListService.ListMembership> memberships = contact.getId() == null
                ? Map.of()
                : audienceListService.membershipsFor(List.of(contact.getId()));
        return AudienceListService.toContactResponse(contact, memberships.get(contact.getId()));
    }

    private Pageable toPageable(Integer page, Integer size, String sort) {
        int pageIndex = page == null || page < 0 ? 0 : page;
        int pageSize = size == null || size <= 0 ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);
        Sort.Direction direction = Sort.Direction.DESC;
        String property = "created_at";
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            property = SORT_COLUMNS.getOrDefault(field, "created_at");
            if (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())) {
                direction = Sort.Direction.ASC;
            }
        }
        return PageRequest.of(pageIndex, pageSize, Sort.by(direction, property));
    }

    private String normalizeStatusFilter(String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return "";
        }
        try {
            return ContactStatus.valueOf(status.trim().toUpperCase(Locale.ROOT)).name();
        } catch (IllegalArgumentException ex) {
            throw new AppException(HttpStatus.BAD_REQUEST, "CONTACT_INVALID_STATUS",
                    "Trạng thái liên hệ không hợp lệ.");
        }
    }

    private String toSearchLike(String q) {
        if (q == null || q.isBlank()) {
            return "";
        }
        String sanitized = q.trim().toLowerCase(Locale.ROOT).replace("%", "\\%").replace("_", "\\_");
        return "%" + sanitized + "%";
    }

    private String blankToEmpty(String value) {
        return value == null || value.isBlank() || "all".equalsIgnoreCase(value) ? "" : value.trim();
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", "Vui lòng nhập địa chỉ email.");
        }
        return email.trim();
    }

    private String blankToFallback(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private void addImportError(
            List<ImportContactsResponse.ImportError> errors,
            int row,
            String email,
            String reason
    ) {
        if (errors.size() >= MAX_IMPORT_ERRORS) {
            return;
        }
        errors.add(ImportContactsResponse.ImportError.builder()
                .row(row)
                .email(email)
                .reason(reason)
                .build());
    }

    private String csvCell(String value) {
        String raw = value == null ? "" : value;
        if (raw.indexOf(',') >= 0 || raw.indexOf('"') >= 0 || raw.indexOf('\n') >= 0 || raw.indexOf('\r') >= 0) {
            return '"' + raw.replace("\"", "\"\"") + '"';
        }
        return raw;
    }

    private List<ContactCustomField> emptyToNull(List<ContactCustomField> fields) {
        if (fields == null || fields.isEmpty()) {
            return null;
        }
        return fields;
    }
}
