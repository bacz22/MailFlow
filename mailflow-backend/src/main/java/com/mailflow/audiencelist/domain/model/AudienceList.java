package com.mailflow.audiencelist.domain.model;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "audience_lists")
public class AudienceList {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tags", columnDefinition = "text[]", nullable = false)
    private String[] tags = new String[0];

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public AudienceList(UUID workspaceId, String name, String description) {
        this.workspaceId = workspaceId;
        this.name = name;
        this.description = description;
    }

    public void apply(String name, String description, List<String> tags) {
        if (name != null) {
            this.name = name;
        }
        if (description != null) {
            this.description = description.isBlank() ? null : description.trim();
        }
        if (tags != null) {
            replaceTags(tags);
        }
    }

    public List<String> tagList() {
        if (tags == null || tags.length == 0) {
            return List.of();
        }
        return List.of(tags);
    }

    public void replaceTags(List<String> incoming) {
        this.tags = normalizeTags(incoming).toArray(String[]::new);
    }

    public static List<String> normalizeTags(List<String> incoming) {
        if (incoming == null || incoming.isEmpty()) {
            return List.of();
        }
        LinkedHashSet<String> unique = new LinkedHashSet<>();
        for (String tag : incoming) {
            if (tag == null) {
                continue;
            }
            String trimmed = tag.trim();
            if (!trimmed.isEmpty()) {
                unique.add(trimmed);
            }
        }
        return List.copyOf(unique);
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (tags == null) {
            tags = new String[0];
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
