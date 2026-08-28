package com.mailflow.workspace.application;

import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.workspace.domain.model.WorkspaceMember;
import com.mailflow.workspace.domain.model.WorkspaceMemberStatus;
import com.mailflow.workspace.domain.model.WorkspaceRole;
import com.mailflow.workspace.domain.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WorkspaceAccessService {

    private static final Set<WorkspaceRole> WORKSPACE_UPDATE_ROLES = Set.of(
            WorkspaceRole.OWNER, WorkspaceRole.ADMIN);
    private static final Set<WorkspaceRole> MEMBER_MANAGE_ROLES = Set.of(
            WorkspaceRole.OWNER, WorkspaceRole.ADMIN);

    private final WorkspaceMemberRepository memberRepository;

    public WorkspaceMember requireActiveMember(UUID userId, UUID workspaceId) {
        WorkspaceMember member = memberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", workspaceId.toString()));
        if (!member.isActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN",
                    "Bạn không còn quyền truy cập workspace này.");
        }
        return member;
    }

    public WorkspaceMember requireCanUpdate(UUID userId, UUID workspaceId) {
        WorkspaceMember member = requireActiveMember(userId, workspaceId);
        if (!WORKSPACE_UPDATE_ROLES.contains(member.getRole())) {
            throw new AppException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN",
                    "Bạn không có quyền cập nhật workspace này.");
        }
        return member;
    }

    public WorkspaceMember requireOwner(UUID userId, UUID workspaceId) {
        WorkspaceMember member = requireActiveMember(userId, workspaceId);
        if (member.getRole() != WorkspaceRole.OWNER) {
            throw new AppException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN",
                    "Chỉ chủ sở hữu mới được thực hiện thao tác này.");
        }
        return member;
    }

    public WorkspaceMember requireCanManageMembers(UUID userId, UUID workspaceId) {
        WorkspaceMember member = requireActiveMember(userId, workspaceId);
        if (!MEMBER_MANAGE_ROLES.contains(member.getRole())) {
            throw new AppException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN",
                    "Bạn không có quyền quản lý thành viên workspace này.");
        }
        return member;
    }

    public long countActiveOwners(UUID workspaceId) {
        return memberRepository.countByWorkspaceIdAndRoleAndStatus(
                workspaceId, WorkspaceRole.OWNER, WorkspaceMemberStatus.ACTIVE);
    }
}
