package com.mailflow.campaign.domain.repository;

import com.mailflow.campaign.domain.model.CampaignRecipient;
import com.mailflow.campaign.domain.model.CampaignRecipientStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface CampaignRecipientRepository extends JpaRepository<CampaignRecipient, UUID> {

    boolean existsByCampaignId(UUID campaignId);

    long countByCampaignIdAndStatus(UUID campaignId, CampaignRecipientStatus status);

    long countByCampaignId(UUID campaignId);

    @Query("""
            SELECT r FROM CampaignRecipient r
            WHERE r.status = com.mailflow.campaign.domain.model.CampaignRecipientStatus.PENDING
              AND r.campaignId IN (
                    SELECT c.id FROM Campaign c
                    WHERE c.status = com.mailflow.campaign.domain.model.CampaignStatus.SENDING
              )
            ORDER BY r.createdAt ASC
            """)
    List<CampaignRecipient> findPendingForSendingCampaigns(Pageable pageable);

    List<CampaignRecipient> findByStatus(CampaignRecipientStatus status);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE CampaignRecipient r
            SET r.status = com.mailflow.campaign.domain.model.CampaignRecipientStatus.SKIPPED,
                r.updatedAt = CURRENT_TIMESTAMP
            WHERE r.campaignId = :campaignId
              AND r.status IN :statuses
            """)
    int skipByCampaignIdAndStatusIn(
            @Param("campaignId") UUID campaignId,
            @Param("statuses") Collection<CampaignRecipientStatus> statuses
    );
}
