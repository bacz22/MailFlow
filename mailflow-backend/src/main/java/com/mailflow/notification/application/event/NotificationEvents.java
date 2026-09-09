package com.mailflow.notification.application.event;

import java.util.UUID;

public class NotificationEvents {

    public record CampaignCompleted(
            UUID workspaceId,
            UUID campaignId,
            String campaignName,
            UUID createdBy,
            int recipientCount
    ) {}

    public record CampaignFailed(
            UUID workspaceId,
            UUID campaignId,
            String campaignName,
            UUID createdBy,
            String reason
    ) {}

    public record CampaignApprovalRequested(
            UUID workspaceId,
            UUID campaignId,
            String campaignName,
            UUID requestedBy
    ) {}

    public record CampaignApproved(
            UUID workspaceId,
            UUID campaignId,
            String campaignName,
            UUID approvedBy,
            UUID createdBy
    ) {}

    public record CampaignRejected(
            UUID workspaceId,
            UUID campaignId,
            String campaignName,
            UUID rejectedBy,
            UUID createdBy,
            String reason
    ) {}

    public record ContactImportCompleted(
            UUID workspaceId,
            UUID userId,
            int importedCount,
            int failedCount
    ) {}

    public record QuotaExceeded(
            UUID workspaceId,
            UUID campaignId,
            String campaignName,
            UUID createdBy,
            long dailyLimit
    ) {}

    public record DomainVerified(
            UUID workspaceId,
            UUID domainId,
            String domainName
    ) {}

    public record DomainVerificationFailed(
            UUID workspaceId,
            UUID domainId,
            String domainName,
            String reason
    ) {}

    public record MemberInvited(
            UUID workspaceId,
            UUID actorId,
            String email,
            String role
    ) {}

    public record MemberJoined(
            UUID workspaceId,
            UUID userId,
            String memberName,
            String email,
            String role
    ) {}

    public record MemberRoleUpdated(
            UUID workspaceId,
            UUID actorId,
            UUID targetUserId,
            String memberName,
            String newRole
    ) {}

    public record MemberRemoved(
            UUID workspaceId,
            UUID actorId,
            UUID targetUserId,
            String memberName
    ) {}

    public record SystemAlert(
            UUID workspaceId,
            UUID targetUserId,
            String title,
            String message,
            String link
    ) {}
}
