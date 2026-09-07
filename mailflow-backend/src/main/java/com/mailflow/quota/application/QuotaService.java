package com.mailflow.quota.application;

import com.mailflow.common.exception.AppException;
import com.mailflow.quota.api.response.DailySendQuotaResponse;
import com.mailflow.quota.domain.repository.WorkspaceDailyEmailUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuotaService {

    public static final ZoneId QUOTA_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final WorkspaceDailyEmailUsageRepository usageRepository;

    @Value("${mailflow.quota.daily-send-limit:50}")
    private long dailySendLimit;

    @Transactional(readOnly = true)
    public DailySendQuotaResponse getDailyUsage(UUID workspaceId) {
        LocalDate today = today();
        long used = usageRepository.findByWorkspaceIdAndUsageDate(workspaceId, today)
                .map(row -> row.getSentCount())
                .orElse(0L);
        long limit = Math.max(0, dailySendLimit);
        long remaining = Math.max(0, limit - used);
        return DailySendQuotaResponse.builder()
                .used(used)
                .limit(limit)
                .remaining(remaining)
                .resetAt(today.plusDays(1).atStartOfDay(QUOTA_ZONE).toOffsetDateTime())
                .build();
    }

    @Transactional(readOnly = true)
    public void assertCanSend(UUID workspaceId, long requestedCount) {
        if (requestedCount <= 0) {
            return;
        }
        DailySendQuotaResponse usage = getDailyUsage(workspaceId);
        if (usage.getUsed() + requestedCount > usage.getLimit()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "QUOTA_EXCEEDED",
                    "Đã hết hạn mức gửi demo hôm nay ("
                            + usage.getUsed() + "/" + usage.getLimit()
                            + " email). Hạn mức reset lúc 00:00 (GMT+7).");
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSuccessfulSend(UUID workspaceId, long count) {
        if (count <= 0) {
            return;
        }
        usageRepository.incrementSentCount(workspaceId, today(), count);
    }

    /**
     * Atomically consume {@code count} sends against the daily limit.
     * Ensures the usage row exists, then increments only if still under limit.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void consumeSendSlot(UUID workspaceId, long count) {
        if (count <= 0) {
            return;
        }
        long limit = Math.max(0, dailySendLimit);
        LocalDate day = today();
        usageRepository.ensureUsageRow(workspaceId, day);
        int updated = usageRepository.tryIncrementUnderLimit(workspaceId, day, count, limit);
        if (updated == 0) {
            DailySendQuotaResponse usage = getDailyUsage(workspaceId);
            throw new AppException(HttpStatus.BAD_REQUEST, "QUOTA_EXCEEDED",
                    "Đã hết hạn mức gửi demo hôm nay ("
                            + usage.getUsed() + "/" + usage.getLimit()
                            + " email). Hạn mức reset lúc 00:00 (GMT+7).");
        }
    }

    /**
     * Refund slots reserved by {@link #consumeSendSlot} when SMTP fails after reserve.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void releaseSendSlot(UUID workspaceId, long count) {
        if (count <= 0 || workspaceId == null) {
            return;
        }
        usageRepository.releaseSentCount(workspaceId, today(), count);
    }

    public LocalDate today() {
        return LocalDate.now(QUOTA_ZONE);
    }

    public OffsetDateTime nextResetAt() {
        return today().plusDays(1).atStartOfDay(QUOTA_ZONE).toOffsetDateTime();
    }
}
