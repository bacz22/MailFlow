package com.mailflow.notification.domain.repository;

import com.mailflow.notification.domain.model.NotificationRead;
import com.mailflow.notification.domain.model.NotificationReadId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationReadRepository extends JpaRepository<NotificationRead, NotificationReadId> {
    boolean existsByIdNotificationIdAndIdUserId(UUID notificationId, UUID userId);
}
