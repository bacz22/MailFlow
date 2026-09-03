package com.mailflow.contact.domain.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ContactStatus {
    ACTIVE,
    UNSUBSCRIBED,
    BOUNCED,
    INVALID,
    BLOCKED;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ContactStatus fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return ContactStatus.valueOf(value.trim().toUpperCase());
    }
}
