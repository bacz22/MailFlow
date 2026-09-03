package com.mailflow.audiencelist.api;

import com.mailflow.audiencelist.api.request.AddListMembersRequest;
import com.mailflow.audiencelist.api.request.CreateAudienceListRequest;
import com.mailflow.audiencelist.api.request.UpdateAudienceListRequest;
import com.mailflow.audiencelist.api.response.AddedMembersResponse;
import com.mailflow.audiencelist.api.response.AudienceListResponse;
import com.mailflow.audiencelist.application.AudienceListService;
import com.mailflow.contact.api.response.ContactPageResponse;
import com.mailflow.workspace.application.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/lists")
@RequiredArgsConstructor
public class AudienceListController {

    private final AudienceListService audienceListService;

    @GetMapping
    public ResponseEntity<List<AudienceListResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(audienceListService.list(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                q
        ));
    }

    @PostMapping
    public ResponseEntity<AudienceListResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateAudienceListRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(audienceListService.create(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                request
        ));
    }

    @GetMapping("/{listId}")
    public ResponseEntity<AudienceListResponse> get(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId
    ) {
        return ResponseEntity.ok(audienceListService.get(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                listId
        ));
    }

    @PatchMapping("/{listId}")
    public ResponseEntity<AudienceListResponse> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId,
            @Valid @RequestBody UpdateAudienceListRequest request
    ) {
        return ResponseEntity.ok(audienceListService.update(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                listId,
                request
        ));
    }

    @DeleteMapping("/{listId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId
    ) {
        audienceListService.delete(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                listId
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{listId}/duplicate")
    public ResponseEntity<AudienceListResponse> duplicate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(audienceListService.duplicate(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                listId
        ));
    }

    @GetMapping("/{listId}/contacts")
    public ResponseEntity<ContactPageResponse> listContacts(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ResponseEntity.ok(audienceListService.listContacts(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                listId,
                q,
                status,
                page,
                size
        ));
    }

    @PostMapping("/{listId}/members")
    public ResponseEntity<AddedMembersResponse> addMembers(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId,
            @Valid @RequestBody AddListMembersRequest request
    ) {
        return ResponseEntity.ok(audienceListService.addMembers(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                listId,
                request
        ));
    }

    @DeleteMapping("/{listId}/members/{contactId}")
    public ResponseEntity<Void> removeMember(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId,
            @PathVariable UUID contactId
    ) {
        audienceListService.removeMember(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                listId,
                contactId
        );
        return ResponseEntity.noContent().build();
    }
}
