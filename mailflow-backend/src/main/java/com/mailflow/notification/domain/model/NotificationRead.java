package com.mailflow.notification.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
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
@Table(name = "notification_reads")
public class NotificationRead {

    @EmbeddedId
    private NotificationReadId id;

    @Column(name = "read_at", nullable = false)
    private Instant readAt = Instant.now();

    public NotificationRead(UUID notificationId, UUID userId) {
        this.id = new NotificationReadId(notificationId, userId);
        this.readAt = Instant.now();
    }
}
