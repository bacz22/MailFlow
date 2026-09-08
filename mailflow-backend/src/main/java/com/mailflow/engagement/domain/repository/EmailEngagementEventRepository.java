package com.mailflow.engagement.domain.repository;

import com.mailflow.engagement.domain.model.EmailEngagementEvent;
import com.mailflow.engagement.domain.model.EngagementEventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface EmailEngagementEventRepository extends JpaRepository<EmailEngagementEvent, UUID> {

    long countByCampaignIdAndEventType(UUID campaignId, EngagementEventType eventType);

    boolean existsByCampaignIdAndContactIdAndEventType(
            UUID campaignId, UUID contactId, EngagementEventType eventType);

    @Query("""
            SELECT e.campaignId, e.eventType, COUNT(DISTINCT e.contactId)
            FROM EmailEngagementEvent e
            WHERE e.campaignId IN :campaignIds
            GROUP BY e.campaignId, e.eventType
            """)
    List<Object[]> countDistinctContactsByCampaignAndType(@Param("campaignIds") Collection<UUID> campaignIds);

    @Query("""
            SELECT COUNT(DISTINCT e.contactId)
            FROM EmailEngagementEvent e
            WHERE e.workspaceId = :workspaceId
              AND e.eventType = :eventType
              AND e.createdAt >= :from
              AND e.createdAt < :to
            """)
    long countDistinctContactsInRange(
            @Param("workspaceId") UUID workspaceId,
            @Param("eventType") EngagementEventType eventType,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query(value = """
            SELECT CAST(e.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS DATE) AS day, e.event_type, COUNT(DISTINCT e.contact_id)
            FROM email_engagement_events e
            WHERE e.workspace_id = :workspaceId
              AND e.created_at >= :from
              AND e.created_at < :to
              AND e.event_type IN ('OPEN', 'CLICK')
            GROUP BY CAST(e.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS DATE), e.event_type
            ORDER BY day
            """, nativeQuery = true)
    List<Object[]> countDistinctByDayAndType(
            @Param("workspaceId") UUID workspaceId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("""
            SELECT e.targetUrl, COUNT(e)
            FROM EmailEngagementEvent e
            WHERE e.campaignId = :campaignId
              AND e.eventType = com.mailflow.engagement.domain.model.EngagementEventType.CLICK
              AND e.targetUrl IS NOT NULL
            GROUP BY e.targetUrl
            ORDER BY COUNT(e) DESC
            """)
    List<Object[]> topClickedUrls(@Param("campaignId") UUID campaignId, Pageable pageable);

    @Query("""
            SELECT e FROM EmailEngagementEvent e
            WHERE e.campaignId = :campaignId
              AND (:eventType IS NULL OR e.eventType = :eventType)
            ORDER BY e.createdAt DESC
            """)
    Page<EmailEngagementEvent> findByCampaignIdAndOptionalType(
            @Param("campaignId") UUID campaignId,
            @Param("eventType") EngagementEventType eventType,
            Pageable pageable
    );

    @Query("""
            SELECT e FROM EmailEngagementEvent e
            WHERE e.workspaceId = :workspaceId
              AND e.contactId = :contactId
            ORDER BY e.createdAt DESC
            """)
    Page<EmailEngagementEvent> findByWorkspaceIdAndContactId(
            @Param("workspaceId") UUID workspaceId,
            @Param("contactId") UUID contactId,
            Pageable pageable
    );

    @Query("""
            SELECT COUNT(DISTINCT e.contactId)
            FROM EmailEngagementEvent e
            WHERE e.campaignId = :campaignId
              AND e.eventType = :eventType
            """)
    long countDistinctContactsByCampaignAndEventType(
            @Param("campaignId") UUID campaignId,
            @Param("eventType") EngagementEventType eventType
    );
}
