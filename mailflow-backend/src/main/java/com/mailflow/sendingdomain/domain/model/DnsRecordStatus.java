package com.mailflow.sendingdomain.domain.model;

import java.util.Locale;

public enum DnsRecordStatus {
    PENDING,
    VERIFIED,
    FAILED;

    public static DnsRecordStatus fromApi(String raw) {
        if (raw == null || raw.isBlank()) {
            return PENDING;
        }
        return DnsRecordStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    }
}
