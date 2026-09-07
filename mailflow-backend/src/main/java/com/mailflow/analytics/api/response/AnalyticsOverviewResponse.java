package com.mailflow.analytics.api.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsOverviewResponse {

    private long sent;
    private long uniqueOpens;
    private long uniqueClicks;
    private long unsubscribes;
    private long failed;
    private double openRate;
    private double clickRate;
    private double unsubscribeRate;

    /** Percent change vs previous period of equal length; null if previous sent = 0. */
    private Double sentChangePct;
    private Double openChangePct;
    private Double clickChangePct;
}
