package com.mailflow.emailtemplate.api.response;

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
public class EmailTemplateResponse {

    private UUID id;
    private String name;
    private String subject;
    private String previewText;
    private String category;
    private String status;
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;
    private String htmlContent;
    private String thumbnailGradient;
    private String bannerLabel;
    private String bannerTitle;
}
