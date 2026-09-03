package com.mailflow.audiencesegment.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "audience_segments")
public class AudienceSegment {

    public enum MatchLogic {
        AND,
        OR
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_logic", nullable = false, length = 8)
    private MatchLogic matchLogic = MatchLogic.AND;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "conditions", columnDefinition = "jsonb", nullable = false)
    private List<SegmentCondition> conditions = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public AudienceSegment(
            UUID workspaceId,
            String name,
            String description,
            MatchLogic matchLogic,
            List<SegmentCondition> conditions
    ) {
        this.workspaceId = workspaceId;
        this.name = name;
        this.description = description;
        this.matchLogic = matchLogic == null ? MatchLogic.AND : matchLogic;
        this.conditions = conditions == null ? new ArrayList<>() : new ArrayList<>(conditions);
    }

    public void apply(
            String name,
            String description,
            MatchLogic matchLogic,
            List<SegmentCondition> conditions
    ) {
        if (name != null) {
            this.name = name;
        }
        if (description != null) {
            this.description = description.isBlank() ? null : description.trim();
        }
        if (matchLogic != null) {
            this.matchLogic = matchLogic;
        }
        if (conditions != null) {
            this.conditions = new ArrayList<>(conditions);
        }
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (conditions == null) {
            conditions = new ArrayList<>();
        }
        if (matchLogic == null) {
            matchLogic = MatchLogic.AND;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
