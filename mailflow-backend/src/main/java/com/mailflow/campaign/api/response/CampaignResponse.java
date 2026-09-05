package com.mailflow.campaign.api.response;

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
public class CampaignResponse {

    private UUID id;
    private String name;
    private String subject;
    private String previewText;
    private String status;
    private String audienceName;
    private String audienceType;
    private long recipientCount;
    private long sentCount;
    private double openRate;
    private double clickRate;
    private Instant scheduledAt;
    private Instant sentAt;
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;

    private UUID senderId;
    private String senderName;
    private String senderEmail;
    /** True when sender is linked to a VERIFIED sending domain (can use From = sender via ESP). */
    private boolean senderDomainVerified;
    private String replyTo;
    private UUID templateId;
    private String htmlContent;
    private String sendType;
    private String reviewNote;
    private Instant submittedAt;
    private Instant reviewedAt;

    @Builder.Default
    private List<NamedAudienceRef> lists = new ArrayList<>();
    @Builder.Default
    private List<NamedAudienceRef> segments = new ArrayList<>();
    @Builder.Default
    private List<NamedAudienceRef> excludedLists = new ArrayList<>();

    @Builder.Default
    private List<UUID> listIds = new ArrayList<>();
    @Builder.Default
    private List<UUID> segmentIds = new ArrayList<>();
    @Builder.Default
    private List<UUID> excludedListIds = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NamedAudienceRef {
        private UUID id;
        private String name;
    }
}
