package com.mailflow.workspace.domain.repository;

import com.mailflow.workspace.domain.model.WorkspaceMember;
import com.mailflow.workspace.domain.model.WorkspaceMemberStatus;
import com.mailflow.workspace.domain.model.WorkspaceRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, UUID> {
    List<WorkspaceMember> findByUserIdAndStatus(UUID userId, WorkspaceMemberStatus status);

    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

    List<WorkspaceMember> findByWorkspaceIdOrderByJoinedAtAsc(UUID workspaceId);

    long countByWorkspaceIdAndRoleAndStatus(UUID workspaceId, WorkspaceRole role, WorkspaceMemberStatus status);

    boolean existsByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);
}
