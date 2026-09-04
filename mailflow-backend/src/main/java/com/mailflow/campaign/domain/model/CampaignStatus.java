package com.mailflow.campaign.domain.model;

import java.util.Locale;

public enum CampaignStatus {
    DRAFT,
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,
    SCHEDULED,
    CANCELLED;

    public static CampaignStatus fromApi(String raw) {
        if (raw == null || raw.isBlank()) {
            return DRAFT;
        }
        return CampaignStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    }
}
