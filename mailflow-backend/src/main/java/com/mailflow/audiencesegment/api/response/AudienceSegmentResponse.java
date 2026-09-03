package com.mailflow.audiencesegment.api.response;

import com.mailflow.audiencesegment.domain.model.SegmentCondition;
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
public class AudienceSegmentResponse {

    private UUID id;
    private String name;
    private String description;
    private String matchLogic;
    @Builder.Default
    private List<SegmentCondition> conditions = new ArrayList<>();
    private long contactCount;
    private Instant createdAt;
    private Instant updatedAt;
}
