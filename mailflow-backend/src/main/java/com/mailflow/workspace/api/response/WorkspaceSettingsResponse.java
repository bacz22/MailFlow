package com.mailflow.workspace.api.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceSettingsResponse {

    private UUID id;
    private String name;
    private String slug;
    private String displayName;
    private String brandColor;
    private String logoUrl;
    private String timezone;
    private String industry;
    private boolean enableOpenTracking;
    private boolean enableClickTracking;
    private boolean enforceRfc8058;
}
