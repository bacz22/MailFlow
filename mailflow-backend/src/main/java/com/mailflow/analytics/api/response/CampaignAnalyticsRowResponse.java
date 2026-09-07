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
public class CampaignAnalyticsRowResponse {

    private UUID id;
    private String name;
    private Instant sentAt;
    private long recipientsSent;
    private double deliveryRate;
    private double openRate;
    private double clickRate;
    private double bounceRate;
    private double unsubscribeRate;
}
