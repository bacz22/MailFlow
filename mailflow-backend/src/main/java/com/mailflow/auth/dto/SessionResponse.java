package com.mailflow.auth.dto;

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
public class SessionResponse {
    private UUID id;
    private String device;
    private String browser;
    private String operatingSystem;
    private String ipAddress;
    private Instant lastActiveAt;
    private Instant createdAt;
    private boolean isCurrent;
}
