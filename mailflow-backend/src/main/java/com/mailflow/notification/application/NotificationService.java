package com.mailflow.notification.application;

import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.notification.api.dto.NotificationResponse;
import com.mailflow.notification.application.dto.CreateNotificationCommand;
import com.mailflow.notification.domain.model.Notification;
import com.mailflow.notification.domain.model.NotificationRead;
import com.mailflow.notification.domain.repository.NotificationProjection;
import com.mailflow.notification.domain.repository.NotificationReadRepository;
import com.mailflow.notification.domain.repository.NotificationRepository;
import com.mailflow.workspace.application.WorkspaceAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;
    private final WorkspaceAccessService workspaceAccessService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public NotificationResponse dispatchNotification(CreateNotificationCommand cmd) {
        Notification notification = new Notification(
                cmd.workspaceId(),
                cmd.userId(),
                cmd.type(),
                cmd.title(),
                cmd.message(),
                cmd.link()
        );
        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = NotificationResponse.from(saved, false);

        // Real-time dispatch via STOMP broker
        try {
            if (cmd.userId() != null) {
                // Targeted user destination: /user/{userId}/queue/notifications
                messagingTemplate.convertAndSendToUser(
                        cmd.userId().toString(),
                        "/queue/notifications",
                        response
                );
            } else {
                // Workspace broadcast destination: /topic/workspaces/{workspaceId}/notifications
                messagingTemplate.convertAndSend(
                        "/topic/workspaces/" + cmd.workspaceId() + "/notifications",
                        response
                );
            }
            log.debug("Real-time notification dispatched: id={} type={} workspace={} user={}",
                    saved.getId(), saved.getType(), saved.getWorkspaceId(), saved.getUserId());
        } catch (Exception ex) {
            log.error("Failed to dispatch real-time STOMP notification: {}", ex.getMessage(), ex);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(UUID workspaceId, UUID userId, boolean unreadOnly, Pageable pageable) {
        workspaceAccessService.requireActiveMember(userId, workspaceId);
        Page<NotificationProjection> page = unreadOnly
                ? notificationRepository.findUnreadByWorkspaceAndUser(workspaceId, userId, pageable)
                : notificationRepository.findByWorkspaceAndUser(workspaceId, userId, pageable);
        return page.map(NotificationResponse::from);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID workspaceId, UUID userId) {
        workspaceAccessService.requireActiveMember(userId, workspaceId);
        return notificationRepository.countUnread(workspaceId, userId);
    }

    @Transactional
    public void markAsRead(UUID workspaceId, UUID notificationId, UUID userId) {
        workspaceAccessService.requireActiveMember(userId, workspaceId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId.toString()));
        if (!notification.getWorkspaceId().equals(workspaceId)) {
            throw new ResourceNotFoundException("Notification", notificationId.toString());
        }

        if (!notificationReadRepository.existsByIdNotificationIdAndIdUserId(notificationId, userId)) {
            notificationReadRepository.save(new NotificationRead(notificationId, userId));
        }
    }

    @Transactional
    public int markAllAsRead(UUID workspaceId, UUID userId) {
        workspaceAccessService.requireActiveMember(userId, workspaceId);
        return notificationRepository.markAllAsRead(workspaceId, userId);
    }
}
