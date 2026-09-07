package com.mailflow.analytics.api.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EngagementEventResponse {

    private UUID id;
    private UUID campaignId;
    private UUID contactId;
    private String contactEmail;
    private String eventType;
    private String targetUrl;
    private Instant createdAt;
}
