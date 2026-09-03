package com.mailflow.contact.domain.model;

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
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "contacts")
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(nullable = false, length = 320)
    private String email;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(length = 160)
    private String company;

    @Column(length = 40)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContactStatus status = ContactStatus.ACTIVE;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tags", columnDefinition = "text[]", nullable = false)
    private String[] tags = new String[0];

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_fields", columnDefinition = "jsonb", nullable = false)
    private List<ContactCustomField> customFields = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Contact(UUID workspaceId, String email, String firstName, String lastName) {
        this.workspaceId = workspaceId;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String fullName() {
        return (lastName == null ? "" : lastName.trim() + " " + (firstName == null ? "" : firstName.trim())).trim();
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

    public void mergeTags(List<String> incoming) {
        Set<String> merged = new LinkedHashSet<>(tagList());
        merged.addAll(normalizeTags(incoming));
        this.tags = merged.toArray(String[]::new);
    }

    public void applyProfile(
            String firstName,
            String lastName,
            String email,
            String phone,
            String company,
            ContactStatus status,
            List<String> tags,
            List<ContactCustomField> customFields
    ) {
        if (firstName != null) {
            this.firstName = firstName;
        }
        if (lastName != null) {
            this.lastName = lastName;
        }
        if (email != null) {
            this.email = email;
        }
        if (phone != null) {
            this.phone = phone.isBlank() ? null : phone.trim();
        }
        if (company != null) {
            this.company = company.isBlank() ? null : company.trim();
        }
        if (status != null) {
            this.status = status;
        }
        if (tags != null) {
            replaceTags(tags);
        }
        if (customFields != null) {
            this.customFields = sanitizeCustomFields(customFields);
        }
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

    public static List<ContactCustomField> sanitizeCustomFields(List<ContactCustomField> incoming) {
        if (incoming == null || incoming.isEmpty()) {
            return new ArrayList<>();
        }
        List<ContactCustomField> cleaned = new ArrayList<>();
        for (ContactCustomField field : incoming) {
            if (field == null || field.getKey() == null || field.getKey().isBlank()) {
                continue;
            }
            cleaned.add(new ContactCustomField(
                    field.getKey().trim(),
                    field.getValue() == null ? "" : field.getValue().trim()
            ));
        }
        return cleaned;
    }

    @Override
    public String toString() {
        return "Contact{id=" + id + ", email=" + email + ", tags=" + Arrays.toString(tags) + "}";
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (tags == null) {
            tags = new String[0];
        }
        if (customFields == null) {
            customFields = new ArrayList<>();
        }
        if (status == null) {
            status = ContactStatus.ACTIVE;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
