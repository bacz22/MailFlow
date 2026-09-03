package com.mailflow.audiencetag.domain.repository;

import com.mailflow.audiencetag.domain.model.AudienceTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AudienceTagRepository extends JpaRepository<AudienceTag, UUID> {

    Optional<AudienceTag> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

    boolean existsByWorkspaceIdAndNameIgnoreCase(UUID workspaceId, String name);

    List<AudienceTag> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);

    @Query("""
            SELECT t FROM AudienceTag t
            WHERE t.workspaceId = :workspaceId
              AND LOWER(t.name) LIKE :q
            ORDER BY t.createdAt DESC
            """)
    List<AudienceTag> search(@Param("workspaceId") UUID workspaceId, @Param("q") String q);
}
