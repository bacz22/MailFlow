package com.mailflow.notification;

import com.mailflow.notification.application.NotificationEventListener;
import com.mailflow.notification.application.NotificationService;
import com.mailflow.notification.application.dto.CreateNotificationCommand;
import com.mailflow.notification.application.event.NotificationEvents;
import com.mailflow.notification.domain.model.NotificationType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificationEventListenerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationEventListener listener;

    @Test
    void onDomainVerified_dispatchesDomainVerifiedNotification() {
        UUID workspaceId = UUID.randomUUID();
        UUID domainId = UUID.randomUUID();
        String domainName = "mailflow.dev";

        listener.onDomainVerified(new NotificationEvents.DomainVerified(workspaceId, domainId, domainName));

        ArgumentCaptor<CreateNotificationCommand> captor = ArgumentCaptor.forClass(CreateNotificationCommand.class);
        verify(notificationService).dispatchNotification(captor.capture());

        CreateNotificationCommand cmd = captor.getValue();
        assertThat(cmd.workspaceId()).isEqualTo(workspaceId);
        assertThat(cmd.userId()).isNull();
        assertThat(cmd.type()).isEqualTo(NotificationType.DOMAIN_VERIFIED);
        assertThat(cmd.title()).contains("xác thực");
        assertThat(cmd.message()).contains(domainName);
        assertThat(cmd.link()).isEqualTo("/domains");
    }

    @Test
    void onDomainVerificationFailed_dispatchesDomainVerificationFailedNotification() {
        UUID workspaceId = UUID.randomUUID();
        UUID domainId = UUID.randomUUID();
        String domainName = "mailflow.dev";

        listener.onDomainVerificationFailed(new NotificationEvents.DomainVerificationFailed(
                workspaceId, domainId, domainName, "DKIM record missing"));

        ArgumentCaptor<CreateNotificationCommand> captor = ArgumentCaptor.forClass(CreateNotificationCommand.class);
        verify(notificationService).dispatchNotification(captor.capture());

        CreateNotificationCommand cmd = captor.getValue();
        assertThat(cmd.workspaceId()).isEqualTo(workspaceId);
        assertThat(cmd.userId()).isNull();
        assertThat(cmd.type()).isEqualTo(NotificationType.DOMAIN_VERIFICATION_FAILED);
        assertThat(cmd.message()).contains(domainName).contains("DKIM record missing");
        assertThat(cmd.link()).isEqualTo("/domains");
    }

    @Test
    void onMemberInvited_dispatchesMemberInvitedNotification() {
        UUID workspaceId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        String email = "colleague@mailflow.dev";

        listener.onMemberInvited(new NotificationEvents.MemberInvited(workspaceId, actorId, email, "EDITOR"));

        ArgumentCaptor<CreateNotificationCommand> captor = ArgumentCaptor.forClass(CreateNotificationCommand.class);
        verify(notificationService).dispatchNotification(captor.capture());

        CreateNotificationCommand cmd = captor.getValue();
        assertThat(cmd.workspaceId()).isEqualTo(workspaceId);
        assertThat(cmd.userId()).isNull();
        assertThat(cmd.type()).isEqualTo(NotificationType.MEMBER_INVITED);
        assertThat(cmd.message()).contains(email).contains("EDITOR");
        assertThat(cmd.link()).isEqualTo("/settings/workspace");
    }

    @Test
    void onMemberJoined_dispatchesMemberJoinedNotification() {
        UUID workspaceId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        listener.onMemberJoined(new NotificationEvents.MemberJoined(
                workspaceId, userId, "Nguyen Van A", "a@mailflow.dev", "EDITOR"));

        ArgumentCaptor<CreateNotificationCommand> captor = ArgumentCaptor.forClass(CreateNotificationCommand.class);
        verify(notificationService).dispatchNotification(captor.capture());

        CreateNotificationCommand cmd = captor.getValue();
        assertThat(cmd.workspaceId()).isEqualTo(workspaceId);
        assertThat(cmd.userId()).isNull();
        assertThat(cmd.type()).isEqualTo(NotificationType.MEMBER_JOINED);
        assertThat(cmd.message()).contains("Nguyen Van A").contains("EDITOR");
        assertThat(cmd.link()).isEqualTo("/settings/workspace");
    }

    @Test
    void onMemberRoleUpdated_dispatchesTargetedNotificationToUser() {
        UUID workspaceId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        UUID targetUserId = UUID.randomUUID();

        listener.onMemberRoleUpdated(new NotificationEvents.MemberRoleUpdated(
                workspaceId, actorId, targetUserId, "Nguyen Van A", "ADMIN"));

        ArgumentCaptor<CreateNotificationCommand> captor = ArgumentCaptor.forClass(CreateNotificationCommand.class);
        verify(notificationService).dispatchNotification(captor.capture());

        CreateNotificationCommand cmd = captor.getValue();
        assertThat(cmd.workspaceId()).isEqualTo(workspaceId);
        assertThat(cmd.userId()).isEqualTo(targetUserId);
        assertThat(cmd.type()).isEqualTo(NotificationType.MEMBER_ROLE_UPDATED);
        assertThat(cmd.message()).contains("ADMIN");
        assertThat(cmd.link()).isEqualTo("/settings/workspace");
    }

    @Test
    void onMemberRemoved_dispatchesMemberRemovedNotification() {
        UUID workspaceId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        UUID targetUserId = UUID.randomUUID();

        listener.onMemberRemoved(new NotificationEvents.MemberRemoved(
                workspaceId, actorId, targetUserId, "Nguyen Van A"));

        ArgumentCaptor<CreateNotificationCommand> captor = ArgumentCaptor.forClass(CreateNotificationCommand.class);
        verify(notificationService).dispatchNotification(captor.capture());

        CreateNotificationCommand cmd = captor.getValue();
        assertThat(cmd.workspaceId()).isEqualTo(workspaceId);
        assertThat(cmd.userId()).isNull();
        assertThat(cmd.type()).isEqualTo(NotificationType.MEMBER_REMOVED);
        assertThat(cmd.message()).contains("Nguyen Van A");
        assertThat(cmd.link()).isEqualTo("/settings/workspace");
    }

    @Test
    void onSystemAlert_dispatchesSystemAlertNotification() {
        UUID workspaceId = UUID.randomUUID();
        UUID targetUserId = UUID.randomUUID();

        listener.onSystemAlert(new NotificationEvents.SystemAlert(
                workspaceId, targetUserId, "Cảnh báo bảo mật", "Phát hiện đăng nhập lạ", "/profile/security"));

        ArgumentCaptor<CreateNotificationCommand> captor = ArgumentCaptor.forClass(CreateNotificationCommand.class);
        verify(notificationService).dispatchNotification(captor.capture());

        CreateNotificationCommand cmd = captor.getValue();
        assertThat(cmd.workspaceId()).isEqualTo(workspaceId);
        assertThat(cmd.userId()).isEqualTo(targetUserId);
        assertThat(cmd.type()).isEqualTo(NotificationType.SYSTEM_ALERT);
        assertThat(cmd.title()).isEqualTo("Cảnh báo bảo mật");
        assertThat(cmd.message()).isEqualTo("Phát hiện đăng nhập lạ");
        assertThat(cmd.link()).isEqualTo("/profile/security");
    }
}
