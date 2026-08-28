package com.mailflow.workspace.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "workspaces")
public class Workspace {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 140)
    private String slug;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(name = "brand_color", nullable = false, length = 16)
    private String brandColor = "#2563eb";

    @Column(name = "logo_url", length = 512)
    private String logoUrl;

    @Column(name = "logo_public_id", length = 255)
    private String logoPublicId;

    @Column(nullable = false, length = 80)
    private String timezone = "Asia/Bangkok";

    @Column(length = 120)
    private String industry;

    @Column(name = "enable_open_tracking", nullable = false)
    private boolean enableOpenTracking = true;

    @Column(name = "enable_click_tracking", nullable = false)
    private boolean enableClickTracking = true;

    @Column(name = "enforce_rfc8058", nullable = false)
    private boolean enforceRfc8058 = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Workspace(String name, String slug, String displayName) {
        this.name = name;
        this.slug = slug;
        this.displayName = displayName;
    }

    public void updateSettings(
            String name,
            String slug,
            String displayName,
            String brandColor,
            String timezone,
            String industry,
            Boolean enableOpenTracking,
            Boolean enableClickTracking,
            Boolean enforceRfc8058
    ) {
        if (name != null) {
            this.name = name;
        }
        if (slug != null) {
            this.slug = slug;
        }
        if (displayName != null) {
            this.displayName = displayName;
        }
        if (brandColor != null) {
            this.brandColor = brandColor;
        }
        if (timezone != null) {
            this.timezone = timezone;
        }
        if (industry != null) {
            this.industry = industry.isBlank() ? null : industry;
        }
        if (enableOpenTracking != null) {
            this.enableOpenTracking = enableOpenTracking;
        }
        if (enableClickTracking != null) {
            this.enableClickTracking = enableClickTracking;
        }
        if (enforceRfc8058 != null) {
            this.enforceRfc8058 = enforceRfc8058;
        }
    }

    public void updateLogo(String logoUrl, String logoPublicId) {
        this.logoUrl = logoUrl;
        this.logoPublicId = logoPublicId;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
