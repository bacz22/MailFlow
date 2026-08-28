package com.mailflow.workspace.domain.model;

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
@Table(name = "workspace_members")
public class WorkspaceMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private WorkspaceRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WorkspaceMemberStatus status = WorkspaceMemberStatus.ACTIVE;

    @Column(name = "invited_at")
    private Instant invitedAt;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public WorkspaceMember(UUID workspaceId, UUID userId, WorkspaceRole role) {
        this.workspaceId = workspaceId;
        this.userId = userId;
        this.role = role;
        this.status = WorkspaceMemberStatus.ACTIVE;
        this.joinedAt = Instant.now();
    }

    public void changeRole(WorkspaceRole role) {
        this.role = role;
    }

    public boolean isActive() {
        return status == WorkspaceMemberStatus.ACTIVE;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (joinedAt == null) {
            joinedAt = now;
        }
        if (status == null) {
            status = WorkspaceMemberStatus.ACTIVE;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
