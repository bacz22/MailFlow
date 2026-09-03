package com.mailflow.audiencesegment.domain.repository;

import com.mailflow.audiencesegment.domain.model.AudienceSegment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AudienceSegmentRepository extends JpaRepository<AudienceSegment, UUID> {

    Optional<AudienceSegment> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

    boolean existsByWorkspaceIdAndNameIgnoreCase(UUID workspaceId, String name);

    List<AudienceSegment> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);

    @Query("""
            SELECT s FROM AudienceSegment s
            WHERE s.workspaceId = :workspaceId
              AND (
                    LOWER(s.name) LIKE :q
                    OR LOWER(COALESCE(s.description, '')) LIKE :q
                  )
            ORDER BY s.createdAt DESC
            """)
    List<AudienceSegment> search(@Param("workspaceId") UUID workspaceId, @Param("q") String q);
}
