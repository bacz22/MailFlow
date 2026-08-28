package com.mailflow.workspace.api.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mailflow.workspace.domain.model.WorkspaceRole;
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
public class WorkspaceSummaryResponse {

    private UUID id;
    private String name;
    private String logoUrl;
    @Builder.Default
    private String plan = "Free";
    private WorkspaceRole role;
    @JsonProperty("isCurrent")
    private boolean current;
}
