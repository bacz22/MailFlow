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

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "campaign_recipients")
public class CampaignRecipient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "campaign_id", nullable = false)
    private UUID campaignId;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(name = "contact_id", nullable = false)
    private UUID contactId;

    @Column(nullable = false, length = 320)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CampaignRecipientStatus status = CampaignRecipientStatus.PENDING;

    @Column(length = 1000)
    private String error;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public CampaignRecipient(UUID campaignId, UUID workspaceId, UUID contactId, String email) {
        this.campaignId = campaignId;
        this.workspaceId = workspaceId;
        this.contactId = contactId;
        this.email = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        this.status = CampaignRecipientStatus.PENDING;
        this.attempts = 0;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = CampaignRecipientStatus.PENDING;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
