package com.mailflow.analytics.api.response;

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
public class CampaignReportResponse {

    private UUID campaignId;
    private String name;
    private String status;
    private long sentCount;
    private long failedCount;
    private long uniqueOpens;
    private long uniqueClicks;
    private long unsubscribedRecipients;
    private double openRate;
    private double clickRate;
    private double unsubscribeRate;
    private double bounceRate;
    private Instant startedAt;
    private Instant completedAt;

    @Builder.Default
    private List<TopLink> topLinks = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopLink {
        private String url;
        private long clicks;
    }
}
