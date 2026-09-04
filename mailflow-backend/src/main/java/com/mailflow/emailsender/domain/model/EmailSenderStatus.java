package com.mailflow.emailsender.domain.model;

import java.util.Locale;

public enum EmailSenderStatus {
    ACTIVE,
    DISABLED;

    public static EmailSenderStatus fromApi(String raw) {
        if (raw == null || raw.isBlank()) {
            return ACTIVE;
        }
        String normalized = raw.trim().toUpperCase(Locale.ROOT);
        if ("VERIFIED".equals(normalized)) {
            return ACTIVE;
        }
        if ("FAILED".equals(normalized) || "PENDING".equals(normalized)) {
            return DISABLED;
        }
        return EmailSenderStatus.valueOf(normalized);
    }
}
