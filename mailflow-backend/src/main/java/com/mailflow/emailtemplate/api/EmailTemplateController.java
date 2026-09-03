package com.mailflow.emailtemplate.api;

import com.mailflow.emailtemplate.api.request.CreateEmailTemplateRequest;
import com.mailflow.emailtemplate.api.request.SendTestEmailTemplateRequest;
import com.mailflow.emailtemplate.api.request.UpdateEmailTemplateRequest;
import com.mailflow.emailtemplate.api.response.EmailTemplateResponse;
import com.mailflow.emailtemplate.application.EmailTemplateService;
import com.mailflow.workspace.application.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/templates")
@RequiredArgsConstructor
public class EmailTemplateController {

    private final EmailTemplateService emailTemplateService;

    @GetMapping
    public ResponseEntity<List<EmailTemplateResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(emailTemplateService.list(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                q,
                status,
                category
        ));
    }

    @PostMapping
    public ResponseEntity<EmailTemplateResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateEmailTemplateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(emailTemplateService.create(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                request
        ));
    }

    @GetMapping("/{templateId}")
    public ResponseEntity<EmailTemplateResponse> get(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID templateId
    ) {
        return ResponseEntity.ok(emailTemplateService.get(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                templateId
        ));
    }

    @PatchMapping("/{templateId}")
    public ResponseEntity<EmailTemplateResponse> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID templateId,
            @Valid @RequestBody UpdateEmailTemplateRequest request
    ) {
        return ResponseEntity.ok(emailTemplateService.update(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                templateId,
                request
        ));
    }

    @DeleteMapping("/{templateId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID templateId
    ) {
        emailTemplateService.delete(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                templateId
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{templateId}/duplicate")
    public ResponseEntity<EmailTemplateResponse> duplicate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID templateId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(emailTemplateService.duplicate(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                templateId
        ));
    }

    @PostMapping("/{templateId}/send-test")
    public ResponseEntity<Void> sendTest(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID templateId,
            @Valid @RequestBody SendTestEmailTemplateRequest request
    ) {
        emailTemplateService.sendTest(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                templateId,
                request
        );
        return ResponseEntity.noContent().build();
    }
}
