package com.mailflow.quota.domain.repository;

import com.mailflow.quota.domain.model.WorkspaceDailyEmailUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceDailyEmailUsageRepository
        extends JpaRepository<WorkspaceDailyEmailUsage, WorkspaceDailyEmailUsage.Pk> {

    Optional<WorkspaceDailyEmailUsage> findByWorkspaceIdAndUsageDate(UUID workspaceId, LocalDate usageDate);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            INSERT INTO workspace_daily_email_usage (workspace_id, usage_date, sent_count)
            VALUES (:workspaceId, :usageDate, :count)
            ON CONFLICT (workspace_id, usage_date)
            DO UPDATE SET sent_count = workspace_daily_email_usage.sent_count + EXCLUDED.sent_count
            """, nativeQuery = true)
    int incrementSentCount(
            @Param("workspaceId") UUID workspaceId,
            @Param("usageDate") LocalDate usageDate,
            @Param("count") long count
    );
}
