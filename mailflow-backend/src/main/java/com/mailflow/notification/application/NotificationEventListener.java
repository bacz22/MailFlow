package com.mailflow.notification.application;

import com.mailflow.notification.application.dto.CreateNotificationCommand;
import com.mailflow.notification.application.event.NotificationEvents;
import com.mailflow.notification.domain.model.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onCampaignCompleted(NotificationEvents.CampaignCompleted event) {
        log.info("Handling CampaignCompleted event for campaign={}", event.campaignId());
        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                null,
                NotificationType.CAMPAIGN_COMPLETED,
                "Chiến dịch đã gửi hoàn tất",
                "Chiến dịch '" + event.campaignName() + "' đã gửi thành công tới " + event.recipientCount() + " người nhận.",
                "/campaigns/" + event.campaignId()
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onCampaignFailed(NotificationEvents.CampaignFailed event) {
        log.info("Handling CampaignFailed event for campaign={}", event.campaignId());
        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                null,
                NotificationType.CAMPAIGN_FAILED,
                "Chiến dịch gửi thất bại",
                "Chiến dịch '" + event.campaignName() + "' gặp sự cố: " + (event.reason() != null ? event.reason() : "Không rõ nguyên nhân"),
                "/campaigns/" + event.campaignId()
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onCampaignApprovalRequested(NotificationEvents.CampaignApprovalRequested event) {
        log.info("Handling CampaignApprovalRequested event for campaign={}", event.campaignId());
        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                null,
                NotificationType.CAMPAIGN_APPROVAL_REQUESTED,
                "Yêu cầu phê duyệt chiến dịch",
                "Chiến dịch '" + event.campaignName() + "' đang chờ duyệt trước khi gửi.",
                "/campaigns/" + event.campaignId()
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onCampaignApproved(NotificationEvents.CampaignApproved event) {
        log.info("Handling CampaignApproved event for campaign={}", event.campaignId());
        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                event.createdBy(),
                NotificationType.CAMPAIGN_APPROVED,
                "Chiến dịch đã được duyệt",
                "Chiến dịch '" + event.campaignName() + "' của bạn đã được phê duyệt.",
                "/campaigns/" + event.campaignId()
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onCampaignRejected(NotificationEvents.CampaignRejected event) {
        log.info("Handling CampaignRejected event for campaign={}", event.campaignId());
        String reasonSuffix = event.reason() != null && !event.reason().isBlank() ? ": " + event.reason() : ".";
        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                event.createdBy(),
                NotificationType.CAMPAIGN_REJECTED,
                "Chiến dịch bị từ chối",
                "Chiến dịch '" + event.campaignName() + "' của bạn đã bị từ chối" + reasonSuffix,
                "/campaigns/" + event.campaignId()
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onContactImportCompleted(NotificationEvents.ContactImportCompleted event) {
        log.info("Handling ContactImportCompleted event for workspace={} user={}", event.workspaceId(), event.userId());
        NotificationType type = event.importedCount() > 0 ? NotificationType.CONTACT_IMPORT_COMPLETED : NotificationType.CONTACT_IMPORT_FAILED;
        String title = event.importedCount() > 0 ? "Nhập danh bạ hoàn tất" : "Nhập danh bạ thất bại";
        String message = event.importedCount() > 0
                ? "Đã nhập thành công " + event.importedCount() + " liên hệ" + (event.failedCount() > 0 ? " (" + event.failedCount() + " lỗi)." : ".")
                : "Không thể nhập liên hệ (" + event.failedCount() + " lỗi dữ liệu).";

        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                event.userId(),
                type,
                title,
                message,
                "/contacts"
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onQuotaExceeded(NotificationEvents.QuotaExceeded event) {
        log.info("Handling QuotaExceeded event for campaign={}", event.campaignId());
        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                null,
                NotificationType.QUOTA_EXCEEDED,
                "Chạm hạn mức gửi thư",
                "Chiến dịch '" + event.campaignName() + "' tạm dừng do đạt hạn ngạch " + event.dailyLimit() + " email/ngày.",
                "/settings/billing/usage"
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onDomainVerified(NotificationEvents.DomainVerified event) {
        log.info("Handling DomainVerified event for workspace={} domain={}", event.workspaceId(), event.domainName());
        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                null,
                NotificationType.DOMAIN_VERIFIED,
                "Tên miền đã được xác thực",
                "Tên miền '" + event.domainName() + "' đã cấu hình DNS thành công và sẵn sàng để gửi email.",
                "/domains"
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onDomainVerificationFailed(NotificationEvents.DomainVerificationFailed event) {
        log.info("Handling DomainVerificationFailed event for workspace={} domain={}", event.workspaceId(), event.domainName());
        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                null,
                NotificationType.DOMAIN_VERIFICATION_FAILED,
                "Xác thực tên miền thất bại",
                "Tên miền '" + event.domainName() + "' chưa vượt qua kiểm tra DNS: " + (event.reason() != null ? event.reason() : "Không rõ nguyên nhân"),
                "/domains"
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onMemberInvited(NotificationEvents.MemberInvited event) {
        log.info("Handling MemberInvited event for workspace={} email={}", event.workspaceId(), event.email());
        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                null,
                NotificationType.MEMBER_INVITED,
                "Đã gửi thư mời thành viên",
                "Đã gửi thư mời tham gia workspace tới " + event.email() + " (vai trò " + event.role() + ").",
                "/settings/workspace"
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onMemberJoined(NotificationEvents.MemberJoined event) {
        log.info("Handling MemberJoined event for workspace={} user={}", event.workspaceId(), event.userId());
        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                null,
                NotificationType.MEMBER_JOINED,
                "Thành viên mới gia nhập",
                event.memberName() + " (" + event.email() + ") đã gia nhập workspace với vai trò " + event.role() + ".",
                "/settings/workspace"
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onMemberRoleUpdated(NotificationEvents.MemberRoleUpdated event) {
        log.info("Handling MemberRoleUpdated event for workspace={} targetUser={}", event.workspaceId(), event.targetUserId());
        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                event.targetUserId(),
                NotificationType.MEMBER_ROLE_UPDATED,
                "Cập nhật vai trò thành viên",
                "Vai trò của bạn trong workspace đã được cập nhật thành " + event.newRole() + ".",
                "/settings/workspace"
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onMemberRemoved(NotificationEvents.MemberRemoved event) {
        log.info("Handling MemberRemoved event for workspace={} targetUser={}", event.workspaceId(), event.targetUserId());
        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                null,
                NotificationType.MEMBER_REMOVED,
                "Thành viên đã rời workspace",
                event.memberName() + " đã được xóa khỏi workspace.",
                "/settings/workspace"
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onSystemAlert(NotificationEvents.SystemAlert event) {
        log.info("Handling SystemAlert event for workspace={} targetUser={}", event.workspaceId(), event.targetUserId());
        notificationService.dispatchNotification(new CreateNotificationCommand(
                event.workspaceId(),
                event.targetUserId(),
                NotificationType.SYSTEM_ALERT,
                event.title(),
                event.message(),
                event.link()
        ));
    }
}
