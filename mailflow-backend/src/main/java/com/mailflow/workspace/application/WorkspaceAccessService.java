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
    private static final Set<WorkspaceRole> CONTACT_READ_ROLES = Set.of(
            WorkspaceRole.OWNER,
            WorkspaceRole.ADMIN,
            WorkspaceRole.MARKETING_MANAGER,
            WorkspaceRole.CAMPAIGN_EDITOR,
            WorkspaceRole.CONTACT_MANAGER,
            WorkspaceRole.ANALYST);
    private static final Set<WorkspaceRole> CONTACT_MUTATE_ROLES = Set.of(
            WorkspaceRole.OWNER,
            WorkspaceRole.ADMIN,
            WorkspaceRole.MARKETING_MANAGER,
            WorkspaceRole.CONTACT_MANAGER);

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

    public WorkspaceMember requireContactRead(UUID userId, UUID workspaceId) {
        return requireRoles(userId, workspaceId, CONTACT_READ_ROLES,
                "Bạn không có quyền xem danh bạ workspace này.");
    }

    public WorkspaceMember requireContactWrite(UUID userId, UUID workspaceId) {
        return requireRoles(userId, workspaceId, CONTACT_MUTATE_ROLES,
                "Bạn không có quyền chỉnh sửa danh bạ workspace này.");
    }

    public WorkspaceMember requireContactDelete(UUID userId, UUID workspaceId) {
        return requireRoles(userId, workspaceId, CONTACT_MUTATE_ROLES,
                "Bạn không có quyền xóa liên hệ trong workspace này.");
    }

    public WorkspaceMember requireContactImport(UUID userId, UUID workspaceId) {
        return requireRoles(userId, workspaceId, CONTACT_MUTATE_ROLES,
                "Bạn không có quyền nạp danh bạ workspace này.");
    }

    public WorkspaceMember requireContactExport(UUID userId, UUID workspaceId) {
        return requireRoles(userId, workspaceId, CONTACT_MUTATE_ROLES,
                "Bạn không có quyền xuất danh bạ workspace này.");
    }

    private WorkspaceMember requireRoles(
            UUID userId,
            UUID workspaceId,
            Set<WorkspaceRole> allowed,
            String message
    ) {
        WorkspaceMember member = requireActiveMember(userId, workspaceId);
        if (!allowed.contains(member.getRole())) {
            throw new AppException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN", message);
        }
        return member;
    }
}
