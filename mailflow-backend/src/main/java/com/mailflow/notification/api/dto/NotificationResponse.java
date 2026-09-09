package com.mailflow.notification.api.dto;

import com.mailflow.notification.domain.model.Notification;
import com.mailflow.notification.domain.model.NotificationType;
import com.mailflow.notification.domain.repository.NotificationProjection;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID workspaceId,
        UUID userId,
        NotificationType type,
        String title,
        String message,
        String link,
        boolean isRead,
        Instant createdAt
) {
    public static NotificationResponse from(NotificationProjection p) {
        return new NotificationResponse(
                p.getId(),
                p.getWorkspaceId(),
                p.getUserId(),
                p.getType(),
                p.getTitle(),
                p.getMessage(),
                p.getLink(),
                p.getIsRead(),
                p.getCreatedAt()
        );
    }

    public static NotificationResponse from(Notification n, boolean isRead) {
        return new NotificationResponse(
                n.getId(),
                n.getWorkspaceId(),
                n.getUserId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getLink(),
                isRead,
                n.getCreatedAt()
        );
    }
}
