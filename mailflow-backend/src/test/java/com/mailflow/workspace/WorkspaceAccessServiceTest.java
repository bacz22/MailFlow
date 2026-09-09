package com.mailflow.workspace;

import com.mailflow.common.exception.AppException;
import com.mailflow.workspace.application.WorkspaceAccessService;
import com.mailflow.workspace.domain.model.WorkspaceMember;
import com.mailflow.workspace.domain.model.WorkspaceRole;
import com.mailflow.workspace.domain.repository.WorkspaceMemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkspaceAccessServiceTest {

    @Mock
    private WorkspaceMemberRepository memberRepository;

    @InjectMocks
    private WorkspaceAccessService accessService;

    @Test
    void requireCampaignRead_allowsViewerRole() {
        UUID userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID();
        WorkspaceMember viewer = new WorkspaceMember(workspaceId, userId, WorkspaceRole.VIEWER);

        when(memberRepository.findByWorkspaceIdAndUserId(workspaceId, userId))
                .thenReturn(Optional.of(viewer));

        WorkspaceMember result = accessService.requireCampaignRead(userId, workspaceId);
        assertThat(result).isNotNull();
        assertThat(result.getRole()).isEqualTo(WorkspaceRole.VIEWER);
    }

    @Test
    void requireTemplateRead_allowsViewerRole() {
        UUID userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID();
        WorkspaceMember viewer = new WorkspaceMember(workspaceId, userId, WorkspaceRole.VIEWER);

        when(memberRepository.findByWorkspaceIdAndUserId(workspaceId, userId))
                .thenReturn(Optional.of(viewer));

        WorkspaceMember result = accessService.requireTemplateRead(userId, workspaceId);
        assertThat(result).isNotNull();
        assertThat(result.getRole()).isEqualTo(WorkspaceRole.VIEWER);
    }

    @Test
    void requireCampaignWrite_forbidsViewerRole() {
        UUID userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID();
        WorkspaceMember viewer = new WorkspaceMember(workspaceId, userId, WorkspaceRole.VIEWER);

        when(memberRepository.findByWorkspaceIdAndUserId(workspaceId, userId))
                .thenReturn(Optional.of(viewer));

        assertThatThrownBy(() -> accessService.requireCampaignWrite(userId, workspaceId))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Bạn không có quyền chỉnh sửa chiến dịch workspace này.");
    }

    @Test
    void requireContactRead_forbidsViewerRole() {
        UUID userId = UUID.randomUUID();
        UUID workspaceId = UUID.randomUUID();
        WorkspaceMember viewer = new WorkspaceMember(workspaceId, userId, WorkspaceRole.VIEWER);

        when(memberRepository.findByWorkspaceIdAndUserId(workspaceId, userId))
                .thenReturn(Optional.of(viewer));

        assertThatThrownBy(() -> accessService.requireContactRead(userId, workspaceId))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Bạn không có quyền xem danh bạ workspace này.");
    }
}
