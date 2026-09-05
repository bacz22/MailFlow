package com.mailflow.sendingdomain.domain.repository;

import com.mailflow.sendingdomain.domain.model.SendingDomain;
import com.mailflow.sendingdomain.domain.model.SendingDomainStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SendingDomainRepository extends JpaRepository<SendingDomain, UUID> {

    Optional<SendingDomain> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

    boolean existsByWorkspaceIdAndDomainIgnoreCase(UUID workspaceId, String domain);

    boolean existsByDomainIgnoreCase(String domain);

    Optional<SendingDomain> findByWorkspaceIdAndDomainIgnoreCase(UUID workspaceId, String domain);

    List<SendingDomain> findByWorkspaceIdOrderByUpdatedAtDesc(UUID workspaceId);

    @Query("""
            SELECT d FROM SendingDomain d
            WHERE d.workspaceId = :workspaceId
              AND (:status IS NULL OR d.status = :status)
              AND (
                    :q = ''
                    OR LOWER(d.domain) LIKE :q
                  )
            ORDER BY d.updatedAt DESC
            """)
    List<SendingDomain> search(
            @Param("workspaceId") UUID workspaceId,
            @Param("q") String q,
            @Param("status") SendingDomainStatus status
    );
}
