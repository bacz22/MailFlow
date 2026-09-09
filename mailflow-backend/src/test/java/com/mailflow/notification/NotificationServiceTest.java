package com.mailflow.notification;

import com.mailflow.notification.api.dto.NotificationResponse;
import com.mailflow.notification.application.NotificationService;
import com.mailflow.notification.application.dto.CreateNotificationCommand;
import com.mailflow.notification.domain.model.Notification;
import com.mailflow.notification.domain.model.NotificationRead;
import com.mailflow.notification.domain.model.NotificationType;
import com.mailflow.notification.domain.repository.NotificationReadRepository;
import com.mailflow.notification.domain.repository.NotificationRepository;
import com.mailflow.workspace.application.WorkspaceAccessService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationReadRepository notificationReadRepository;

    @Mock
    private WorkspaceAccessService workspaceAccessService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void dispatchNotification_workspaceBroadcast_savesAndSendsToTopic() {
        UUID workspaceId = UUID.randomUUID();
        CreateNotificationCommand cmd = new CreateNotificationCommand(
                workspaceId,
                null,
                NotificationType.CAMPAIGN_COMPLETED,
                "Chiến dịch hoàn tất",
                "Đã gửi thành công",
                "/campaigns/123"
        );

        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        NotificationResponse response = notificationService.dispatchNotification(cmd);

        assertThat(response).isNotNull();
        assertThat(response.title()).isEqualTo("Chiến dịch hoàn tất");
        assertThat(response.isRead()).isFalse();

        verify(messagingTemplate).convertAndSend(
                eq("/topic/workspaces/" + workspaceId + "/notifications"),
                any(NotificationResponse.class)
        );
    }

    @Test
    void dispatchNotification_userTargeted_sendsToUserQueue() {
        UUID workspaceId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        CreateNotificationCommand cmd = new CreateNotificationCommand(
                workspaceId,
                userId,
                NotificationType.CAMPAIGN_APPROVED,
                "Chiến dịch được duyệt",
                "Sẵn sàng gửi",
                "/campaigns/456"
        );

        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        NotificationResponse response = notificationService.dispatchNotification(cmd);

        assertThat(response.userId()).isEqualTo(userId);

        verify(messagingTemplate).convertAndSendToUser(
                eq(userId.toString()),
                eq("/queue/notifications"),
                any(NotificationResponse.class)
        );
    }

    @Test
    void getUnreadCount_verifiesMemberAndReturnsCount() {
        UUID workspaceId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        when(notificationRepository.countUnread(workspaceId, userId)).thenReturn(5L);

        long count = notificationService.getUnreadCount(workspaceId, userId);

        assertThat(count).isEqualTo(5L);
        verify(workspaceAccessService).requireActiveMember(userId, workspaceId);
    }

    @Test
    void markAsRead_savesNotificationReadIfNotPresent() {
        UUID workspaceId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID notifId = UUID.randomUUID();

        Notification notif = new Notification(workspaceId, null, NotificationType.CAMPAIGN_COMPLETED, "Title", "Msg", "/link");

        when(notificationRepository.findById(notifId)).thenReturn(Optional.of(notif));
        when(notificationReadRepository.existsByIdNotificationIdAndIdUserId(notifId, userId)).thenReturn(false);

        notificationService.markAsRead(workspaceId, notifId, userId);

        ArgumentCaptor<NotificationRead> captor = ArgumentCaptor.forClass(NotificationRead.class);
        verify(notificationReadRepository).save(captor.capture());
        assertThat(captor.getValue().getId().getNotificationId()).isEqualTo(notifId);
        assertThat(captor.getValue().getId().getUserId()).isEqualTo(userId);
    }

    @Test
    void markAllAsRead_callsRepositoryAtomicQuery() {
        UUID workspaceId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        when(notificationRepository.markAllAsRead(workspaceId, userId)).thenReturn(3);

        int updated = notificationService.markAllAsRead(workspaceId, userId);

        assertThat(updated).isEqualTo(3);
        verify(notificationRepository).markAllAsRead(workspaceId, userId);
    }
}
