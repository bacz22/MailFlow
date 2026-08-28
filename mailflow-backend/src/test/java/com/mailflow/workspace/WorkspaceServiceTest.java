package com.mailflow.workspace;

import com.mailflow.auth.infrastructure.jwt.AccessTokenService;
import com.mailflow.auth.infrastructure.jwt.JwtProperties;
import com.mailflow.auth.infrastructure.token.SecureTokenGenerator;
import com.mailflow.common.exception.AppException;
import com.mailflow.infrastructure.storage.ImageStorageService;
import com.mailflow.infrastructure.storage.ImageStorageService.StoredImage;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.repository.UserRepository;
import com.mailflow.workspace.api.request.CreateWorkspaceRequest;
import com.mailflow.workspace.api.request.UpdateMemberRoleRequest;
import com.mailflow.workspace.api.response.SwitchWorkspaceResponse;
import com.mailflow.workspace.application.WorkspaceAccessService;
import com.mailflow.workspace.application.WorkspaceBootstrapService;
import com.mailflow.workspace.application.WorkspaceService;
import com.mailflow.workspace.domain.model.Workspace;
import com.mailflow.workspace.domain.model.WorkspaceMember;
import com.mailflow.workspace.domain.model.WorkspaceMemberStatus;
import com.mailflow.workspace.domain.model.WorkspaceRole;
import com.mailflow.workspace.domain.repository.WorkspaceInvitationRepository;
import com.mailflow.workspace.domain.repository.WorkspaceMemberRepository;
import com.mailflow.workspace.domain.repository.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.context.ApplicationEventPublisher;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkspaceServiceTest {

    @Mock WorkspaceRepository workspaceRepository;
    @Mock WorkspaceMemberRepository memberRepository;
    @Mock WorkspaceInvitationRepository invitationRepository;
    @Mock UserRepository userRepository;
    @Mock WorkspaceAccessService accessService;
    @Mock WorkspaceBootstrapService bootstrapService;
    @Mock AccessTokenService accessTokenService;
    @Mock JwtProperties jwtProperties;
    @Mock SecureTokenGenerator tokenGenerator;
    @Mock ApplicationEventPublisher eventPublisher;
    @Mock ImageStorageService imageStorageService;
    @InjectMocks WorkspaceService workspaceService;

    @Test
    void listWorkspaces_returnsActiveMemberships() {
        UUID userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID();
        Workspace workspace = new Workspace("Acme", "acme", "Acme");
        workspace.setId(workspaceId);
        WorkspaceMember member = new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER);
        when(memberRepository.findByUserIdAndStatus(userId, WorkspaceMemberStatus.ACTIVE))
                .thenReturn(List.of(member));
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));

        var result = workspaceService.listWorkspaces(userId, workspaceId);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().isCurrent()).isTrue();
        assertThat(result.getFirst().getName()).isEqualTo("Acme");
    }

    @Test
    void createWorkspace_delegatesToBootstrap() {
        UUID userId = UUID.randomUUID();
        User user = new User("a@mailflow.dev", "hash", "A", "B");
        user.setId(userId);
        Workspace workspace = new Workspace("New", "new", "New");
        workspace.setId(UUID.randomUUID());
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(bootstrapService.createOwnedWorkspace(eq(user), eq("New"))).thenReturn(workspace);

        var created = workspaceService.createWorkspace(userId, CreateWorkspaceRequest.builder().name("New").build());

        assertThat(created.getRole()).isEqualTo(WorkspaceRole.OWNER);
        assertThat(created.getName()).isEqualTo("New");
    }

    @Test
    void switchWorkspace_issuesTokenWithWid() {
        UUID userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        User user = new User("a@mailflow.dev", "hash", "A", "B");
        user.setId(userId);
        Workspace workspace = new Workspace("Acme", "acme", "Acme");
        workspace.setId(workspaceId);
        WorkspaceMember member = new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER);
        when(accessService.requireActiveMember(userId, workspaceId)).thenReturn(member);
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(jwtProperties.getAccessTokenTtl()).thenReturn(Duration.ofMinutes(15));
        when(accessTokenService.issueWorkspaceAccessToken(eq(user), eq(sessionId), eq(workspaceId), any()))
                .thenReturn("ws-token");

        SwitchWorkspaceResponse response = workspaceService.switchWorkspace(userId, workspaceId, sessionId.toString());

        assertThat(response.getAccessToken()).isEqualTo("ws-token");
        assertThat(response.getRole()).isEqualTo(WorkspaceRole.OWNER);
        assertThat(response.getWorkspaceId()).isEqualTo(workspaceId);
    }

    @Test
    void updateMemberRole_rejectsDemotingLastOwner() {
        UUID actorId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        WorkspaceMember actor = new WorkspaceMember(workspaceId, actorId, WorkspaceRole.OWNER);
        actor.setId(memberId);
        when(accessService.requireCanManageMembers(actorId, workspaceId)).thenReturn(actor);
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(actor));
        when(accessService.countActiveOwners(workspaceId)).thenReturn(1L);

        assertThatThrownBy(() -> workspaceService.updateMemberRole(
                actorId, workspaceId, memberId, UpdateMemberRoleRequest.builder().role(WorkspaceRole.ADMIN).build()))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("code", "LAST_OWNER");
    }

    @Test
    void deleteWorkspace_requiresOwner() {
        UUID userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID();
        when(accessService.requireOwner(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));

        workspaceService.deleteWorkspace(userId, workspaceId);

        verify(workspaceRepository).deleteById(workspaceId);
    }

    @Test
    void requireCurrentWorkspaceId_throwsWhenClaimMissing() {
        assertThatThrownBy(() -> WorkspaceService.requireCurrentWorkspaceId(null))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("code", "WORKSPACE_REQUIRED");
    }

    @Test
    void updateLogo_savesCloudinaryUrl() {
        UUID userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID();
        Workspace workspace = new Workspace("Acme", "acme", "Acme");
        workspace.setId(workspaceId);
        when(accessService.requireCanUpdate(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));
        when(workspaceRepository.save(any(Workspace.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(imageStorageService.uploadWorkspaceLogo(eq(workspaceId), any(byte[].class), eq("image/png")))
                .thenReturn(new StoredImage(
                        "https://res.cloudinary.com/demo/image/upload/v1/mailflow/workspace-logos/" + workspaceId,
                        "mailflow/workspace-logos/" + workspaceId));

        MockMultipartFile file = new MockMultipartFile("file", "logo.png", "image/png", new byte[] {1, 2, 3});
        var response = workspaceService.updateLogo(userId, workspaceId, file);

        assertThat(response.getLogoUrl()).startsWith("https://res.cloudinary.com/");
        verify(imageStorageService).uploadWorkspaceLogo(eq(workspaceId), any(byte[].class), eq("image/png"));
    }

    @Test
    void updateLogo_rejectsNonImage() {
        UUID userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID();
        when(accessService.requireCanUpdate(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        MockMultipartFile file = new MockMultipartFile("file", "note.txt", "text/plain", new byte[] {1});

        assertThatThrownBy(() -> workspaceService.updateLogo(userId, workspaceId, file))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("code", "LOGO_TYPE_INVALID");
        verify(imageStorageService, never()).uploadWorkspaceLogo(any(), any(), any());
    }
}
