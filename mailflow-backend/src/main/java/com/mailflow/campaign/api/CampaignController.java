package com.mailflow.campaign.api;

import com.mailflow.campaign.api.request.ReviewCampaignRequest;
import com.mailflow.campaign.api.request.SendTestCampaignRequest;
import com.mailflow.campaign.api.request.UpsertCampaignRequest;
import com.mailflow.campaign.api.response.CampaignResponse;
import com.mailflow.campaign.application.CampaignService;
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
@RequestMapping("/api/v1/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    @GetMapping
    public ResponseEntity<List<CampaignResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(campaignService.list(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                q,
                status
        ));
    }

    @PostMapping
    public ResponseEntity<CampaignResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpsertCampaignRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(campaignService.create(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                request
        ));
    }

    @GetMapping("/{campaignId}")
    public ResponseEntity<CampaignResponse> get(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID campaignId
    ) {
        return ResponseEntity.ok(campaignService.get(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                campaignId
        ));
    }

    @PatchMapping("/{campaignId}")
    public ResponseEntity<CampaignResponse> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID campaignId,
            @Valid @RequestBody UpsertCampaignRequest request
    ) {
        return ResponseEntity.ok(campaignService.update(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                campaignId,
                request
        ));
    }

    @DeleteMapping("/{campaignId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID campaignId
    ) {
        campaignService.delete(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                campaignId
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{campaignId}/submit")
    public ResponseEntity<CampaignResponse> submit(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID campaignId
    ) {
        return ResponseEntity.ok(campaignService.submit(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                campaignId
        ));
    }

    @PostMapping("/{campaignId}/approve")
    public ResponseEntity<CampaignResponse> approve(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID campaignId,
            @RequestBody(required = false) ReviewCampaignRequest request
    ) {
        return ResponseEntity.ok(campaignService.approve(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                campaignId,
                request == null ? new ReviewCampaignRequest() : request
        ));
    }

    @PostMapping("/{campaignId}/reject")
    public ResponseEntity<CampaignResponse> reject(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID campaignId,
            @Valid @RequestBody ReviewCampaignRequest request
    ) {
        return ResponseEntity.ok(campaignService.reject(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                campaignId,
                request
        ));
    }

    @PostMapping("/{campaignId}/cancel")
    public ResponseEntity<CampaignResponse> cancel(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID campaignId
    ) {
        return ResponseEntity.ok(campaignService.cancel(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                campaignId
        ));
    }

    @PostMapping("/{campaignId}/send-test")
    public ResponseEntity<Void> sendTest(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID campaignId,
            @Valid @RequestBody SendTestCampaignRequest request
    ) {
        campaignService.sendTest(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                campaignId,
                request
        );
        return ResponseEntity.noContent().build();
    }
}
