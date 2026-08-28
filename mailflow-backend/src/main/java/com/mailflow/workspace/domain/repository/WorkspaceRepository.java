package com.mailflow.workspace.domain.repository;

import com.mailflow.workspace.domain.model.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {
    boolean existsBySlugIgnoreCase(String slug);

    Optional<Workspace> findBySlugIgnoreCase(String slug);
}
