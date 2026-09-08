package com.mailflow.infrastructure.mail;

import java.util.UUID;

/**
 * Optional headers for campaign ESP send: List-Unsubscribe + MailFlow correlation for Brevo webhooks.
 */
public record CampaignMailHeaders(
        ListUnsubscribeHeaders listUnsubscribe,
        UUID recipientId,
        UUID workspaceId
) {
    public static CampaignMailHeaders of(
            ListUnsubscribeHeaders listUnsubscribe,
            UUID recipientId,
            UUID workspaceId
    ) {
        return new CampaignMailHeaders(listUnsubscribe, recipientId, workspaceId);
    }

    public static CampaignMailHeaders tracking(UUID recipientId, UUID workspaceId) {
        return new CampaignMailHeaders(null, recipientId, workspaceId);
    }

    public boolean hasListUnsubscribe() {
        return listUnsubscribe != null && listUnsubscribe.isPresent();
    }

    public boolean hasTracking() {
        return recipientId != null;
    }
}
