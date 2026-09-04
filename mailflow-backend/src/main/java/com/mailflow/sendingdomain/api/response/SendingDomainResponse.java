package com.mailflow.sendingdomain.api.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendingDomainResponse {

    private UUID id;
    private String domain;
    private String status;
    private Instant createdAt;
    private Instant verifiedAt;
    private Instant updatedAt;
    private long sendersCount;

    @Builder.Default
    private List<DnsRecordResponse> records = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DnsRecordResponse {
        private UUID id;
        private String type;
        private String name;
        private String host;
        private String value;
        private String status;
        private String purpose;
        private String description;
    }
}
