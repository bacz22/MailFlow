package com.mailflow.campaign.domain.repository;

import com.mailflow.campaign.domain.model.CampaignRecipient;
import com.mailflow.campaign.domain.model.CampaignRecipientStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
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

    @Query("""
            SELECT COUNT(r)
            FROM CampaignRecipient r
            WHERE r.workspaceId = :workspaceId
              AND r.status = com.mailflow.campaign.domain.model.CampaignRecipientStatus.SENT
              AND r.sentAt >= :from
              AND r.sentAt < :to
            """)
    long countSentInRange(
            @Param("workspaceId") UUID workspaceId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("""
            SELECT COUNT(r)
            FROM CampaignRecipient r
            WHERE r.workspaceId = :workspaceId
              AND r.status = com.mailflow.campaign.domain.model.CampaignRecipientStatus.FAILED
              AND r.updatedAt >= :from
              AND r.updatedAt < :to
            """)
    long countFailedInRange(
            @Param("workspaceId") UUID workspaceId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query(value = """
            SELECT CAST(r.sent_at AS DATE) AS day, COUNT(*)
            FROM campaign_recipients r
            WHERE r.workspace_id = :workspaceId
              AND r.status = 'SENT'
              AND r.sent_at >= :from
              AND r.sent_at < :to
            GROUP BY CAST(r.sent_at AS DATE)
            ORDER BY day
            """, nativeQuery = true)
    List<Object[]> countSentByDay(
            @Param("workspaceId") UUID workspaceId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("""
            SELECT COUNT(DISTINCT r.contactId)
            FROM CampaignRecipient r
            WHERE r.campaignId = :campaignId
              AND r.contactId IN (
                    SELECT c.id FROM Contact c
                    WHERE c.workspaceId = r.workspaceId
                      AND c.status = com.mailflow.contact.domain.model.ContactStatus.UNSUBSCRIBED
              )
            """)
    long countUnsubscribedRecipients(@Param("campaignId") UUID campaignId);

    @Query("""
            SELECT COUNT(DISTINCT r.contactId)
            FROM CampaignRecipient r
            WHERE r.workspaceId = :workspaceId
              AND r.status = com.mailflow.campaign.domain.model.CampaignRecipientStatus.SENT
              AND r.sentAt >= :from
              AND r.sentAt < :to
              AND r.contactId IN (
                    SELECT c.id FROM Contact c
                    WHERE c.workspaceId = :workspaceId
                      AND c.status = com.mailflow.contact.domain.model.ContactStatus.UNSUBSCRIBED
                      AND c.updatedAt >= :from
                      AND c.updatedAt < :to
              )
            """)
    long countUnsubsInRange(
            @Param("workspaceId") UUID workspaceId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );
}
