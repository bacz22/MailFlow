package com.mailflow.audiencetag.api;

import com.mailflow.audiencetag.api.request.CreateAudienceTagRequest;
import com.mailflow.audiencetag.api.request.UpdateAudienceTagRequest;
import com.mailflow.audiencetag.api.response.AudienceTagResponse;
import com.mailflow.audiencetag.api.response.SyncTagsResponse;
import com.mailflow.audiencetag.application.AudienceTagService;
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
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class AudienceTagController {

    private final AudienceTagService audienceTagService;

    @GetMapping
    public ResponseEntity<List<AudienceTagResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(audienceTagService.list(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                q
        ));
    }

    @PostMapping
    public ResponseEntity<AudienceTagResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateAudienceTagRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(audienceTagService.create(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                request
        ));
    }

    @PatchMapping("/{tagId}")
    public ResponseEntity<AudienceTagResponse> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID tagId,
            @Valid @RequestBody UpdateAudienceTagRequest request
    ) {
        return ResponseEntity.ok(audienceTagService.update(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                tagId,
                request
        ));
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID tagId
    ) {
        audienceTagService.delete(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                tagId
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sync-from-contacts")
    public ResponseEntity<SyncTagsResponse> syncFromContacts(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(audienceTagService.syncFromContacts(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt)
        ));
    }
}
