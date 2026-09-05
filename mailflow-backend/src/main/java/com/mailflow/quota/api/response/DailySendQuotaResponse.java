package com.mailflow.quota.api.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailySendQuotaResponse {

    private long used;
    private long limit;
    private long remaining;
    private OffsetDateTime resetAt;
}
