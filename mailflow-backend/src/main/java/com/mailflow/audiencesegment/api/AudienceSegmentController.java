package com.mailflow.audiencesegment.api;

import com.mailflow.audiencesegment.api.request.CreateAudienceSegmentRequest;
import com.mailflow.audiencesegment.api.request.PreviewAudienceSegmentRequest;
import com.mailflow.audiencesegment.api.request.UpdateAudienceSegmentRequest;
import com.mailflow.audiencesegment.api.response.AudienceSegmentResponse;
import com.mailflow.audiencesegment.application.AudienceSegmentService;
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
@RequestMapping("/api/v1/segments")
@RequiredArgsConstructor
public class AudienceSegmentController {

    private final AudienceSegmentService audienceSegmentService;

    @GetMapping
    public ResponseEntity<List<AudienceSegmentResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(audienceSegmentService.list(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                q
        ));
    }

    @PostMapping
    public ResponseEntity<AudienceSegmentResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateAudienceSegmentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(audienceSegmentService.create(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                request
        ));
    }

    @PostMapping("/preview")
    public ResponseEntity<ContactPageResponse> preview(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody PreviewAudienceSegmentRequest request
    ) {
        return ResponseEntity.ok(audienceSegmentService.preview(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                request
        ));
    }

    @GetMapping("/{segmentId}")
    public ResponseEntity<AudienceSegmentResponse> get(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID segmentId
    ) {
        return ResponseEntity.ok(audienceSegmentService.get(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                segmentId
        ));
    }

    @PatchMapping("/{segmentId}")
    public ResponseEntity<AudienceSegmentResponse> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID segmentId,
            @Valid @RequestBody UpdateAudienceSegmentRequest request
    ) {
        return ResponseEntity.ok(audienceSegmentService.update(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                segmentId,
                request
        ));
    }

    @DeleteMapping("/{segmentId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID segmentId
    ) {
        audienceSegmentService.delete(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                segmentId
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{segmentId}/duplicate")
    public ResponseEntity<AudienceSegmentResponse> duplicate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID segmentId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(audienceSegmentService.duplicate(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                segmentId
        ));
    }

    @GetMapping("/{segmentId}/contacts")
    public ResponseEntity<ContactPageResponse> listContacts(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID segmentId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ResponseEntity.ok(audienceSegmentService.listContacts(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                segmentId,
                q,
                status,
                page,
                size
        ));
    }
}
