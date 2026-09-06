package com.mailflow.engagement.domain.repository;

import com.mailflow.engagement.domain.model.EmailEngagementEvent;
import com.mailflow.engagement.domain.model.EngagementEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}
