package com.mailflow.campaign.domain.repository;

import com.mailflow.campaign.domain.model.Campaign;
import com.mailflow.campaign.domain.model.CampaignStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, UUID> {

    Optional<Campaign> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

    boolean existsByWorkspaceIdAndSenderId(UUID workspaceId, UUID senderId);

    long countByWorkspaceIdAndStatus(UUID workspaceId, CampaignStatus status);

    long countByWorkspaceId(UUID workspaceId);

    @Query("""
            SELECT c FROM Campaign c
            WHERE c.workspaceId = :workspaceId
              AND (:status IS NULL OR c.status = :status)
              AND (
                    :q = ''
                    OR LOWER(c.name) LIKE :q
                    OR LOWER(c.subject) LIKE :q
                  )
            ORDER BY c.updatedAt DESC
            """)
    List<Campaign> search(
            @Param("workspaceId") UUID workspaceId,
            @Param("q") String q,
            @Param("status") CampaignStatus status
    );
}
