package com.mailflow.emailtemplate.domain.model;

import java.util.Locale;

public enum EmailTemplateStatus {
    DRAFT,
    PUBLISHED,
    ARCHIVED;

    public String toApi() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static EmailTemplateStatus fromApi(String raw) {
        if (raw == null || raw.isBlank()) {
            return DRAFT;
        }
        return EmailTemplateStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    }
}
