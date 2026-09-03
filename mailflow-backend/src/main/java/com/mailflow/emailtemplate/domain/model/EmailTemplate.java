package com.mailflow.emailtemplate.domain.model;

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
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "email_templates")
public class EmailTemplate {

    public static final String DEFAULT_THUMBNAIL = "bg-gradient-to-tr from-blue-600 to-indigo-600";
    public static final String DEFAULT_BANNER_LABEL = "MailFlow Communication";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(name = "preview_text", length = 200)
    private String previewText;

    @Column(nullable = false, length = 40)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmailTemplateStatus status = EmailTemplateStatus.DRAFT;

    @Column(name = "html_content", nullable = false, columnDefinition = "TEXT")
    private String htmlContent;

    @Column(name = "thumbnail_gradient", length = 120)
    private String thumbnailGradient;

    @Column(name = "banner_label", length = 80)
    private String bannerLabel;

    @Column(name = "banner_title", length = 200)
    private String bannerTitle;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public EmailTemplate(
            UUID workspaceId,
            String name,
            String subject,
            String previewText,
            String category,
            EmailTemplateStatus status,
            String htmlContent,
            String thumbnailGradient,
            String bannerLabel,
            String bannerTitle,
            UUID createdBy
    ) {
        this.workspaceId = workspaceId;
        this.name = name;
        this.subject = subject;
        this.previewText = previewText;
        this.category = category;
        this.status = status == null ? EmailTemplateStatus.DRAFT : status;
        this.htmlContent = htmlContent;
        this.thumbnailGradient = thumbnailGradient;
        this.bannerLabel = bannerLabel;
        this.bannerTitle = bannerTitle;
        this.createdBy = createdBy;
    }

    public void apply(
            String name,
            String subject,
            String previewText,
            String category,
            EmailTemplateStatus status,
            String htmlContent,
            String thumbnailGradient,
            String bannerLabel,
            String bannerTitle
    ) {
        if (name != null) {
            this.name = name;
        }
        if (subject != null) {
            this.subject = subject;
        }
        if (previewText != null) {
            this.previewText = previewText.isBlank() ? null : previewText;
        }
        if (category != null) {
            this.category = category;
        }
        if (status != null) {
            this.status = status;
        }
        if (htmlContent != null) {
            this.htmlContent = htmlContent;
        }
        if (thumbnailGradient != null) {
            this.thumbnailGradient = thumbnailGradient.isBlank() ? null : thumbnailGradient;
        }
        this.bannerLabel = bannerLabel == null || bannerLabel.isBlank() ? null : bannerLabel.trim();
        this.bannerTitle = bannerTitle == null || bannerTitle.isBlank() ? null : bannerTitle.trim();
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = EmailTemplateStatus.DRAFT;
        }
        if (thumbnailGradient == null || thumbnailGradient.isBlank()) {
            thumbnailGradient = DEFAULT_THUMBNAIL;
        }
        if (bannerLabel == null || bannerLabel.isBlank()) {
            bannerLabel = DEFAULT_BANNER_LABEL;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
