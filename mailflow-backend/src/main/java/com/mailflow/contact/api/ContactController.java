package com.mailflow.contact.api;

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
import com.mailflow.contact.application.ContactService;
import com.mailflow.workspace.application.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @GetMapping
    public ResponseEntity<ContactPageResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort
    ) {
        return ResponseEntity.ok(contactService.list(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                q, status, tag, page, size, sort
        ));
    }

    @GetMapping("/stats")
    public ResponseEntity<ContactStatsResponse> stats(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(contactService.stats(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt)
        ));
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportFiltered(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String tag
    ) {
        String csv = contactService.exportCsv(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                q, status, tag, null
        );
        return csvResponse(csv);
    }

    @PostMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportSelected(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody(required = false) ExportContactsRequest request
    ) {
        String csv = contactService.exportCsv(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                request
        );
        return csvResponse(csv);
    }

    @PostMapping("/import")
    public ResponseEntity<ImportContactsResponse> importContacts(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ImportContactsRequest request
    ) {
        return ResponseEntity.ok(contactService.importContacts(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                request
        ));
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<BulkDeleteResponse> bulkDelete(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody BulkIdsRequest request
    ) {
        return ResponseEntity.ok(contactService.bulkDelete(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                request
        ));
    }

    @PostMapping("/bulk-tags")
    public ResponseEntity<Map<String, Integer>> bulkTags(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody BulkTagsRequest request
    ) {
        int updated = contactService.bulkTags(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                request
        );
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    @PostMapping
    public ResponseEntity<ContactResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateContactRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contactService.create(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                request
        ));
    }

    @GetMapping("/{contactId}")
    public ResponseEntity<ContactResponse> get(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID contactId
    ) {
        return ResponseEntity.ok(contactService.get(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                contactId
        ));
    }

    @PatchMapping("/{contactId}")
    public ResponseEntity<ContactResponse> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID contactId,
            @Valid @RequestBody UpdateContactRequest request
    ) {
        return ResponseEntity.ok(contactService.update(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                contactId,
                request
        ));
    }

    @DeleteMapping("/{contactId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID contactId
    ) {
        contactService.delete(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                contactId
        );
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<byte[]> csvResponse(String csv) {
        byte[] body = csv.getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("contacts_export.csv", StandardCharsets.UTF_8)
                .build());
        headers.setContentLength(body.length);
        return new ResponseEntity<>(body, headers, HttpStatus.OK);
    }
}
