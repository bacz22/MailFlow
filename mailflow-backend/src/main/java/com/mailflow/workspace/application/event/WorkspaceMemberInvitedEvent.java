package com.mailflow.workspace.application.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class WorkspaceMemberInvitedEvent {
    private final String email;
    private final String workspaceName;
    private final String rawToken;
    private final String role;
}
