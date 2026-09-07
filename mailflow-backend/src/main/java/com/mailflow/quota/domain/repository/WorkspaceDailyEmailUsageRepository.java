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

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            INSERT INTO workspace_daily_email_usage (workspace_id, usage_date, sent_count)
            VALUES (:workspaceId, :usageDate, 0)
            ON CONFLICT (workspace_id, usage_date) DO NOTHING
            """, nativeQuery = true)
    int ensureUsageRow(
            @Param("workspaceId") UUID workspaceId,
            @Param("usageDate") LocalDate usageDate
    );

    /**
     * Atomically consume {@code count} if {@code sent_count + count <= limit}.
     * Returns 0 when the quota would be exceeded.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE workspace_daily_email_usage
            SET sent_count = sent_count + :count
            WHERE workspace_id = :workspaceId
              AND usage_date = :usageDate
              AND sent_count + :count <= :limit
            """, nativeQuery = true)
    int tryIncrementUnderLimit(
            @Param("workspaceId") UUID workspaceId,
            @Param("usageDate") LocalDate usageDate,
            @Param("count") long count,
            @Param("limit") long limit
    );

    /** Refund reserved slots after SMTP failure (never below 0). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE workspace_daily_email_usage
            SET sent_count = GREATEST(0, sent_count - :count)
            WHERE workspace_id = :workspaceId
              AND usage_date = :usageDate
            """, nativeQuery = true)
    int releaseSentCount(
            @Param("workspaceId") UUID workspaceId,
            @Param("usageDate") LocalDate usageDate,
            @Param("count") long count
    );
}
