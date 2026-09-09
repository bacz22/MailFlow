package com.mailflow.notification.domain.repository;

import com.mailflow.notification.domain.model.NotificationType;

import java.time.Instant;
import java.util.UUID;

public interface NotificationProjection {
    UUID getId();
    UUID getWorkspaceId();
    UUID getUserId();
    NotificationType getType();
    String getTitle();
    String getMessage();
    String getLink();
    Instant getCreatedAt();
    boolean getIsRead();
}
