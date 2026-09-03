package com.mailflow.audiencetag.api.response;

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
public class AudienceTagResponse {

    private UUID id;
    private String name;
    private String color;
    private long contactCount;
    private Instant createdAt;
    private Instant updatedAt;
}
