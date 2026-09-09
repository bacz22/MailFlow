package com.mailflow.notification.application.dto;

import com.mailflow.notification.domain.model.NotificationType;

import java.util.UUID;

public record CreateNotificationCommand(
        UUID workspaceId,
        UUID userId,
        NotificationType type,
        String title,
        String message,
        String link
) {}
