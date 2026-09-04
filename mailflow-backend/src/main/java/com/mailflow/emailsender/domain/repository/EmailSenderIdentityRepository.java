package com.mailflow.emailsender.domain.repository;

import com.mailflow.emailsender.domain.model.EmailSenderIdentity;
import com.mailflow.emailsender.domain.model.EmailSenderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailSenderIdentityRepository extends JpaRepository<EmailSenderIdentity, UUID> {

    Optional<EmailSenderIdentity> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

    boolean existsByWorkspaceIdAndEmailIgnoreCase(UUID workspaceId, String email);

    List<EmailSenderIdentity> findByWorkspaceIdOrderByUpdatedAtDesc(UUID workspaceId);

    @Query("""
            SELECT s FROM EmailSenderIdentity s
            WHERE s.workspaceId = :workspaceId
              AND (:status IS NULL OR s.status = :status)
              AND (
                    :q = ''
                    OR LOWER(s.name) LIKE :q
                    OR LOWER(s.email) LIKE :q
                  )
            ORDER BY s.updatedAt DESC
            """)
    List<EmailSenderIdentity> search(
            @Param("workspaceId") UUID workspaceId,
            @Param("q") String q,
            @Param("status") EmailSenderStatus status
    );

    @Modifying
    @Query("UPDATE EmailSenderIdentity s SET s.isDefault = false WHERE s.workspaceId = :workspaceId AND s.isDefault = true")
    void clearDefault(@Param("workspaceId") UUID workspaceId);
}
