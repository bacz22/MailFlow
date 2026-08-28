package com.mailflow.workspace;

import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.model.UserStatus;
import com.mailflow.workspace.application.WorkspaceBootstrapService;
import com.mailflow.workspace.domain.model.Workspace;
import com.mailflow.workspace.domain.model.WorkspaceMember;
import com.mailflow.workspace.domain.model.WorkspaceRole;
import com.mailflow.workspace.domain.repository.WorkspaceMemberRepository;
import com.mailflow.workspace.domain.repository.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkspaceBootstrapServiceTest {

    @Mock WorkspaceRepository workspaceRepository;
    @Mock WorkspaceMemberRepository memberRepository;
    @InjectMocks WorkspaceBootstrapService bootstrapService;

    @Test
    void createOwnedWorkspace_savesWorkspaceAndOwnerMembership() {
        User user = new User("owner@mailflow.dev", "hash", "Bac", "Nguyen");
        user.setId(UUID.randomUUID());
        user.setStatus(UserStatus.ACTIVE);
        when(workspaceRepository.existsBySlugIgnoreCase(any())).thenReturn(false);
        when(workspaceRepository.save(any(Workspace.class))).thenAnswer(invocation -> {
            Workspace workspace = invocation.getArgument(0);
            workspace.setId(UUID.randomUUID());
            return workspace;
        });

        Workspace created = bootstrapService.createOwnedWorkspace(user, null);

        assertThat(created.getName()).contains("Nguyen");
        assertThat(created.getSlug()).isNotBlank();
        ArgumentCaptor<WorkspaceMember> memberCaptor = ArgumentCaptor.forClass(WorkspaceMember.class);
        verify(memberRepository).save(memberCaptor.capture());
        assertThat(memberCaptor.getValue().getRole()).isEqualTo(WorkspaceRole.OWNER);
        assertThat(memberCaptor.getValue().getUserId()).isEqualTo(user.getId());
        assertThat(memberCaptor.getValue().getWorkspaceId()).isEqualTo(created.getId());
    }
}
