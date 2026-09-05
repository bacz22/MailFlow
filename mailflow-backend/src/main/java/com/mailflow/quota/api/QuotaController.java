package com.mailflow.quota.api;

import com.mailflow.quota.api.response.DailySendQuotaResponse;
import com.mailflow.quota.application.QuotaService;
import com.mailflow.workspace.application.WorkspaceAccessService;
import com.mailflow.workspace.application.WorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/quota")
@RequiredArgsConstructor
public class QuotaController {

    private final QuotaService quotaService;
    private final WorkspaceAccessService accessService;

    @GetMapping("/daily-send")
    public ResponseEntity<DailySendQuotaResponse> dailySend(
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        UUID workspaceId = WorkspaceService.requireCurrentWorkspaceId(jwt);
        accessService.requireActiveMember(userId, workspaceId);
        return ResponseEntity.ok(quotaService.getDailyUsage(workspaceId));
    }
}
