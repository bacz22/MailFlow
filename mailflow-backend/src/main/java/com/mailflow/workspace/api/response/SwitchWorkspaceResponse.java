package com.mailflow.workspace.api.response;

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
public class SwitchWorkspaceResponse {

    private String accessToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private long expiresIn;
    private UUID workspaceId;
    private String workspaceName;
    private WorkspaceRole role;
}
