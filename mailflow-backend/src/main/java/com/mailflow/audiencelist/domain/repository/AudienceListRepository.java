package com.mailflow.audiencelist.domain.repository;

import com.mailflow.audiencelist.domain.model.AudienceList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AudienceListRepository extends JpaRepository<AudienceList, UUID> {

    Optional<AudienceList> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

    boolean existsByWorkspaceIdAndNameIgnoreCase(UUID workspaceId, String name);

    List<AudienceList> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);

    @Query("""
            SELECT l FROM AudienceList l
            WHERE l.workspaceId = :workspaceId
              AND (
                    LOWER(l.name) LIKE :q
                    OR LOWER(COALESCE(l.description, '')) LIKE :q
                  )
            ORDER BY l.createdAt DESC
            """)
    List<AudienceList> search(@Param("workspaceId") UUID workspaceId, @Param("q") String q);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = """
            UPDATE audience_lists
            SET tags = array_replace(tags, :oldTag, :newTag),
                updated_at = CURRENT_TIMESTAMP
            WHERE workspace_id = :workspaceId
              AND :oldTag = ANY (tags)
            """, nativeQuery = true)
    int renameTagInWorkspace(
            @Param("workspaceId") UUID workspaceId,
            @Param("oldTag") String oldTag,
            @Param("newTag") String newTag
    );

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = """
            UPDATE audience_lists
            SET tags = array_remove(tags, :tag),
                updated_at = CURRENT_TIMESTAMP
            WHERE workspace_id = :workspaceId
              AND :tag = ANY (tags)
            """, nativeQuery = true)
    int removeTagFromWorkspace(
            @Param("workspaceId") UUID workspaceId,
            @Param("tag") String tag
    );
}
