package com.mailflow.contact.domain.repository;

import com.mailflow.contact.domain.model.Contact;
import com.mailflow.contact.domain.model.ContactStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContactRepository extends JpaRepository<Contact, UUID> {

    Optional<Contact> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

    boolean existsByWorkspaceIdAndEmailIgnoreCase(UUID workspaceId, String email);

    Optional<Contact> findByWorkspaceIdAndEmailIgnoreCase(UUID workspaceId, String email);

    long countByWorkspaceId(UUID workspaceId);

    long countByWorkspaceIdAndStatus(UUID workspaceId, ContactStatus status);

    List<Contact> findByWorkspaceIdAndIdIn(UUID workspaceId, Collection<UUID> ids);

    long deleteByWorkspaceIdAndIdIn(UUID workspaceId, Collection<UUID> ids);

    @Query("""
            SELECT c.status, COUNT(c)
            FROM Contact c
            WHERE c.workspaceId = :workspaceId
            GROUP BY c.status
            """)
    List<Object[]> countGroupedByStatus(@Param("workspaceId") UUID workspaceId);

    @Query(value = """
            SELECT DISTINCT t
            FROM contacts c, unnest(c.tags) AS t
            WHERE c.workspace_id = :workspaceId
            ORDER BY t
            """, nativeQuery = true)
    List<String> findDistinctTags(@Param("workspaceId") UUID workspaceId);

    @Query(
            value = """
                    SELECT *
                    FROM contacts c
                    WHERE c.workspace_id = :workspaceId
                      AND (CAST(:status AS text) = '' OR c.status = :status)
                      AND (CAST(:tag AS text) = '' OR :tag = ANY (c.tags))
                      AND (
                            CAST(:q AS text) = ''
                            OR LOWER(c.email) LIKE :q
                            OR LOWER(c.first_name) LIKE :q
                            OR LOWER(c.last_name) LIKE :q
                            OR LOWER(COALESCE(c.company, '')) LIKE :q
                          )
                    """,
            countQuery = """
                    SELECT count(*)
                    FROM contacts c
                    WHERE c.workspace_id = :workspaceId
                      AND (CAST(:status AS text) = '' OR c.status = :status)
                      AND (CAST(:tag AS text) = '' OR :tag = ANY (c.tags))
                      AND (
                            CAST(:q AS text) = ''
                            OR LOWER(c.email) LIKE :q
                            OR LOWER(c.first_name) LIKE :q
                            OR LOWER(c.last_name) LIKE :q
                            OR LOWER(COALESCE(c.company, '')) LIKE :q
                          )
                    """,
            nativeQuery = true
    )
    Page<Contact> search(
            @Param("workspaceId") UUID workspaceId,
            @Param("status") String status,
            @Param("tag") String tag,
            @Param("q") String q,
            Pageable pageable
    );
}
