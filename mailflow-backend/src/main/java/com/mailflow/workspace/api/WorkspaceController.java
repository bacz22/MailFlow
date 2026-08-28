package com.mailflow.workspace.api;

import com.mailflow.workspace.api.request.AcceptInvitationRequest;
import com.mailflow.workspace.api.request.CreateWorkspaceRequest;
import com.mailflow.workspace.api.request.InviteMemberRequest;
import com.mailflow.workspace.api.request.UpdateMemberRoleRequest;
import com.mailflow.workspace.api.request.UpdateWorkspaceRequest;
import com.mailflow.workspace.api.response.SwitchWorkspaceResponse;
import com.mailflow.workspace.api.response.WorkspaceMemberResponse;
import com.mailflow.workspace.api.response.WorkspaceSettingsResponse;
import com.mailflow.workspace.api.response.WorkspaceSummaryResponse;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @GetMapping("/workspaces")
    public ResponseEntity<List<WorkspaceSummaryResponse>> list(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(workspaceService.listWorkspaces(userId, WorkspaceService.currentWorkspaceId(jwt)));
    }

    @PostMapping("/workspaces")
    public ResponseEntity<WorkspaceSummaryResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateWorkspaceRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED).body(workspaceService.createWorkspace(userId, request));
    }

    @PostMapping("/workspaces/{workspaceId}/switch")
    public ResponseEntity<SwitchWorkspaceResponse> switchWorkspace(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID workspaceId
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(workspaceService.switchWorkspace(userId, workspaceId, jwt.getClaimAsString("sid")));
    }

    @GetMapping("/workspaces/{workspaceId}")
    public ResponseEntity<WorkspaceSettingsResponse> get(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID workspaceId
    ) {
        return ResponseEntity.ok(workspaceService.getSettings(UUID.fromString(jwt.getSubject()), workspaceId));
    }

    @PatchMapping("/workspaces/{workspaceId}")
    public ResponseEntity<WorkspaceSettingsResponse> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody UpdateWorkspaceRequest request
    ) {
        return ResponseEntity.ok(
                workspaceService.updateSettings(UUID.fromString(jwt.getSubject()), workspaceId, request));
    }

    @PostMapping("/workspaces/{workspaceId}/logo")
    public ResponseEntity<WorkspaceSettingsResponse> uploadLogo(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID workspaceId,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(
                workspaceService.updateLogo(UUID.fromString(jwt.getSubject()), workspaceId, file));
    }

    @DeleteMapping("/workspaces/{workspaceId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID workspaceId) {
        workspaceService.deleteWorkspace(UUID.fromString(jwt.getSubject()), workspaceId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/workspaces/{workspaceId}/members")
    public ResponseEntity<List<WorkspaceMemberResponse>> members(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID workspaceId
    ) {
        return ResponseEntity.ok(workspaceService.listMembers(UUID.fromString(jwt.getSubject()), workspaceId));
    }

    @PatchMapping("/workspaces/{workspaceId}/members/{memberId}")
    public ResponseEntity<WorkspaceMemberResponse> updateMember(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID workspaceId,
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberRoleRequest request
    ) {
        return ResponseEntity.ok(workspaceService.updateMemberRole(
                UUID.fromString(jwt.getSubject()), workspaceId, memberId, request));
    }

    @DeleteMapping("/workspaces/{workspaceId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID workspaceId,
            @PathVariable UUID memberId
    ) {
        workspaceService.removeMember(UUID.fromString(jwt.getSubject()), workspaceId, memberId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/workspaces/{workspaceId}/invitations")
    public ResponseEntity<Map<String, String>> invite(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody InviteMemberRequest request
    ) {
        workspaceService.inviteMember(UUID.fromString(jwt.getSubject()), workspaceId, request);
        return ResponseEntity.ok(Map.of("message", "Đã gửi thư mời tới email thành viên."));
    }

    @DeleteMapping("/workspaces/{workspaceId}/invitations/{invitationId}")
    public ResponseEntity<Void> cancelInvite(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID workspaceId,
            @PathVariable UUID invitationId
    ) {
        workspaceService.cancelInvitation(UUID.fromString(jwt.getSubject()), workspaceId, invitationId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/workspace-invitations/accept")
    public ResponseEntity<SwitchWorkspaceResponse> accept(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AcceptInvitationRequest request
    ) {
        return ResponseEntity.ok(workspaceService.acceptInvitation(
                UUID.fromString(jwt.getSubject()), request.getToken(), jwt.getClaimAsString("sid")));
    }
}
