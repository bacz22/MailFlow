package com.mailflow.emailtemplate.domain.repository;

import com.mailflow.emailtemplate.domain.model.EmailTemplate;
import com.mailflow.emailtemplate.domain.model.EmailTemplateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, UUID> {

    Optional<EmailTemplate> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

    boolean existsByWorkspaceIdAndNameIgnoreCase(UUID workspaceId, String name);

    boolean existsByWorkspaceIdAndNameIgnoreCaseAndIdNot(UUID workspaceId, String name, UUID id);

    @Query("""
            SELECT t FROM EmailTemplate t
            WHERE t.workspaceId = :workspaceId
              AND (:status IS NULL OR t.status = :status)
              AND (:category = '' OR t.category = :category)
              AND (
                    :q = ''
                    OR LOWER(t.name) LIKE :q
                    OR LOWER(t.subject) LIKE :q
                  )
            ORDER BY t.updatedAt DESC
            """)
    List<EmailTemplate> search(
            @Param("workspaceId") UUID workspaceId,
            @Param("q") String q,
            @Param("status") EmailTemplateStatus status,
            @Param("category") String category
    );
}
