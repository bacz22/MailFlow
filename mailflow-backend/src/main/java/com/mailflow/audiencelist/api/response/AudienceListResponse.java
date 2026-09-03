package com.mailflow.audiencelist.api.response;

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
public class AudienceListResponse {

    private UUID id;
    private String name;
    private String description;
    private long contactCount;
    private long activeCount;
    private long unsubscribedCount;
    @Builder.Default
    private List<String> tags = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;
}
