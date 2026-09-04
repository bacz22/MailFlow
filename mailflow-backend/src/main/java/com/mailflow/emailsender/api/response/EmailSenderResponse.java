package com.mailflow.emailsender.api.response;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class EmailSenderResponse {

    private UUID id;
    private String name;
    private String email;
    private String domain;
    private UUID domainId;
    private String status;
    @JsonProperty("isVerified")
    private boolean isVerified;
    @JsonProperty("isDefault")
    private boolean isDefault;
    private String dkimStatus;
    private String spfStatus;
    private Instant createdAt;
    private Instant lastUsedAt;
}
