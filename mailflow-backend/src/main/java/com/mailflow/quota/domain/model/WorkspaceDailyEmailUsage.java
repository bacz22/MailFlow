package com.mailflow.quota.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "workspace_daily_email_usage")
@IdClass(WorkspaceDailyEmailUsage.Pk.class)
public class WorkspaceDailyEmailUsage {

    @Id
    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Id
    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(name = "sent_count", nullable = false)
    private long sentCount;

    public WorkspaceDailyEmailUsage(UUID workspaceId, LocalDate usageDate, long sentCount) {
        this.workspaceId = workspaceId;
        this.usageDate = usageDate;
        this.sentCount = sentCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Pk implements Serializable {
        private UUID workspaceId;
        private LocalDate usageDate;

        public Pk(UUID workspaceId, LocalDate usageDate) {
            this.workspaceId = workspaceId;
            this.usageDate = usageDate;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof Pk pk)) {
                return false;
            }
            return Objects.equals(workspaceId, pk.workspaceId)
                    && Objects.equals(usageDate, pk.usageDate);
        }

        @Override
        public int hashCode() {
            return Objects.hash(workspaceId, usageDate);
        }
    }
}
