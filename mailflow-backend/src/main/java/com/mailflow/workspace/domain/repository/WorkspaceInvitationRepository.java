package com.mailflow.workspace.domain.repository;

import com.mailflow.workspace.domain.model.WorkspaceInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceInvitationRepository extends JpaRepository<WorkspaceInvitation, UUID> {
    Optional<WorkspaceInvitation> findByTokenHash(String tokenHash);

    List<WorkspaceInvitation> findByWorkspaceIdAndEmailIgnoreCaseAndAcceptedAtIsNull(
            UUID workspaceId,
            String email
    );

    List<WorkspaceInvitation> findByWorkspaceIdAndAcceptedAtIsNull(UUID workspaceId);
}
