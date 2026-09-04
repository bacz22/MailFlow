package com.mailflow.sendingdomain.domain.model;

import java.util.Locale;

public enum DnsRecordPurpose {
    SPF,
    DKIM,
    DMARC,
    MX,
    VERIFY;

    public static DnsRecordPurpose fromApi(String raw) {
        return DnsRecordPurpose.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    }
}
