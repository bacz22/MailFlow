package com.mailflow.campaign.domain.model;

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
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "campaigns")
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(name = "preview_text", length = 200)
    private String previewText;

    @Column(name = "sender_id")
    private UUID senderId;

    @Column(name = "reply_to", length = 320)
    private String replyTo;

    @Column(name = "template_id")
    private UUID templateId;

    @Column(name = "html_content", nullable = false, columnDefinition = "TEXT")
    private String htmlContent = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CampaignStatus status = CampaignStatus.DRAFT;

    @Column(name = "send_type", nullable = false, length = 20)
    private String sendType = "immediate";

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "list_ids", columnDefinition = "uuid[]", nullable = false)
    private UUID[] listIds = new UUID[0];

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "segment_ids", columnDefinition = "uuid[]", nullable = false)
    private UUID[] segmentIds = new UUID[0];

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "excluded_list_ids", columnDefinition = "uuid[]", nullable = false)
    private UUID[] excludedListIds = new UUID[0];

    @Column(name = "estimated_recipients", nullable = false)
    private long estimatedRecipients;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "review_note", length = 1000)
    private String reviewNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Campaign(UUID workspaceId, String name, String subject, UUID createdBy) {
        this.workspaceId = workspaceId;
        this.name = name;
        this.subject = subject;
        this.createdBy = createdBy;
        this.htmlContent = "";
        this.status = CampaignStatus.DRAFT;
        this.sendType = "immediate";
        this.listIds = new UUID[0];
        this.segmentIds = new UUID[0];
        this.excludedListIds = new UUID[0];
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = CampaignStatus.DRAFT;
        }
        if (htmlContent == null) {
            htmlContent = "";
        }
        if (sendType == null || sendType.isBlank()) {
            sendType = "immediate";
        }
        if (listIds == null) {
            listIds = new UUID[0];
        }
        if (segmentIds == null) {
            segmentIds = new UUID[0];
        }
        if (excludedListIds == null) {
            excludedListIds = new UUID[0];
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
