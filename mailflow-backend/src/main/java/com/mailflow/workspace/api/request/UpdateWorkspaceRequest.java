package com.mailflow.workspace.api.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateWorkspaceRequest {

    @Size(min = 1, max = 120)
    private String name;

    @Size(min = 2, max = 140)
    @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug chỉ gồm chữ thường, số và dấu gạch ngang")
    private String slug;

    @Size(max = 120)
    private String displayName;

    @Size(max = 16)
    private String brandColor;

    @Size(max = 80)
    private String timezone;

    @Size(max = 120)
    private String industry;

    private Boolean enableOpenTracking;
    private Boolean enableClickTracking;
    private Boolean enforceRfc8058;
}
