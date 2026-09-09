package com.mailflow.notification.domain.repository;

import com.mailflow.notification.domain.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query(value = """
            SELECT n.id AS id,
                   n.workspaceId AS workspaceId,
                   n.userId AS userId,
                   n.type AS type,
                   n.title AS title,
                   n.message AS message,
                   n.link AS link,
                   n.createdAt AS createdAt,
                   (CASE WHEN nr.id.userId IS NOT NULL THEN true ELSE false END) AS isRead
            FROM Notification n
            LEFT JOIN NotificationRead nr ON nr.id.notificationId = n.id AND nr.id.userId = :userId
            WHERE n.workspaceId = :workspaceId
              AND (n.userId = :userId OR n.userId IS NULL)
            ORDER BY n.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(n)
            FROM Notification n
            WHERE n.workspaceId = :workspaceId
              AND (n.userId = :userId OR n.userId IS NULL)
            """)
    Page<NotificationProjection> findByWorkspaceAndUser(
            @Param("workspaceId") UUID workspaceId,
            @Param("userId") UUID userId,
            Pageable pageable
    );

    @Query(value = """
            SELECT n.id AS id,
                   n.workspaceId AS workspaceId,
                   n.userId AS userId,
                   n.type AS type,
                   n.title AS title,
                   n.message AS message,
                   n.link AS link,
                   n.createdAt AS createdAt,
                   false AS isRead
            FROM Notification n
            LEFT JOIN NotificationRead nr ON nr.id.notificationId = n.id AND nr.id.userId = :userId
            WHERE n.workspaceId = :workspaceId
              AND (n.userId = :userId OR n.userId IS NULL)
              AND nr.id.userId IS NULL
            ORDER BY n.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(n)
            FROM Notification n
            LEFT JOIN NotificationRead nr ON nr.id.notificationId = n.id AND nr.id.userId = :userId
            WHERE n.workspaceId = :workspaceId
              AND (n.userId = :userId OR n.userId IS NULL)
              AND nr.id.userId IS NULL
            """)
    Page<NotificationProjection> findUnreadByWorkspaceAndUser(
            @Param("workspaceId") UUID workspaceId,
            @Param("userId") UUID userId,
            Pageable pageable
    );

    @Query("""
            SELECT COUNT(n)
            FROM Notification n
            WHERE n.workspaceId = :workspaceId
              AND (n.userId = :userId OR n.userId IS NULL)
              AND NOT EXISTS (
                  SELECT 1 FROM NotificationRead nr
                  WHERE nr.id.notificationId = n.id AND nr.id.userId = :userId
              )
            """)
    long countUnread(
            @Param("workspaceId") UUID workspaceId,
            @Param("userId") UUID userId
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            INSERT INTO notification_reads (notification_id, user_id, read_at)
            SELECT n.id, :userId, CURRENT_TIMESTAMP
            FROM notifications n
            WHERE n.workspace_id = :workspaceId
              AND (n.user_id = :userId OR n.user_id IS NULL)
              AND NOT EXISTS (
                  SELECT 1 FROM notification_reads nr
                  WHERE nr.notification_id = n.id AND nr.user_id = :userId
              )
            ON CONFLICT (notification_id, user_id) DO NOTHING
            """, nativeQuery = true)
    int markAllAsRead(
            @Param("workspaceId") UUID workspaceId,
            @Param("userId") UUID userId
    );
}
