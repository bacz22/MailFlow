package com.mailflow.campaign.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class UpsertCampaignRequest {

    @NotBlank(message = "Vui lòng nhập tên chiến dịch.")
    @Size(max = 200)
    private String name;

    @NotBlank(message = "Vui lòng nhập tiêu đề email.")
    @Size(max = 200)
    private String subject;

    @Size(max = 200)
    private String previewText;

    private UUID senderId;

    @Size(max = 320)
    private String replyTo;

    private UUID templateId;

    private String htmlContent;

    @Size(max = 20)
    private String sendType;

    private Instant scheduledAt;

    @Builder.Default
    private List<UUID> listIds = new ArrayList<>();

    @Builder.Default
    private List<UUID> segmentIds = new ArrayList<>();

    @Builder.Default
    private List<UUID> excludedListIds = new ArrayList<>();
}
