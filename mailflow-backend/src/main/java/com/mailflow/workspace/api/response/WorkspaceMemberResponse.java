package com.mailflow.workspace.api.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mailflow.workspace.domain.model.WorkspaceMemberStatus;
import com.mailflow.workspace.domain.model.WorkspaceRole;
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
public class WorkspaceMemberResponse {

    private UUID id;
    private UUID userId;
    private String name;
    private String email;
    private WorkspaceRole role;
    private WorkspaceMemberStatus status;
    private String avatarUrl;
    private Instant joinedAt;
    private Instant lastActiveAt;
    @JsonProperty("isCurrentUser")
    private boolean currentUser;
}
