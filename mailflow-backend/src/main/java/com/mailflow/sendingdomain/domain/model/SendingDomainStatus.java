package com.mailflow.sendingdomain.domain.model;

import java.util.Locale;

public enum SendingDomainStatus {
    PENDING,
    VERIFIED,
    FAILED;

    public static SendingDomainStatus fromApi(String raw) {
        if (raw == null || raw.isBlank()) {
            return PENDING;
        }
        return SendingDomainStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    }
}
