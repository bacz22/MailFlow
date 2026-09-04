package com.mailflow.emailsender.api;

import com.mailflow.emailsender.api.request.CreateEmailSenderRequest;
import com.mailflow.emailsender.api.request.UpdateEmailSenderRequest;
import com.mailflow.emailsender.api.response.EmailSenderResponse;
import com.mailflow.emailsender.application.EmailSenderIdentityService;
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
@RequestMapping("/api/v1/senders")
@RequiredArgsConstructor
public class EmailSenderIdentityController {

    private final EmailSenderIdentityService senderService;

    @GetMapping
    public ResponseEntity<List<EmailSenderResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(senderService.list(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                q,
                status
        ));
    }

    @PostMapping
    public ResponseEntity<EmailSenderResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateEmailSenderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(senderService.create(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                request
        ));
    }

    @PatchMapping("/{senderId}")
    public ResponseEntity<EmailSenderResponse> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID senderId,
            @Valid @RequestBody UpdateEmailSenderRequest request
    ) {
        return ResponseEntity.ok(senderService.update(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                senderId,
                request
        ));
    }

    @DeleteMapping("/{senderId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID senderId
    ) {
        senderService.delete(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                senderId
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{senderId}/default")
    public ResponseEntity<EmailSenderResponse> setDefault(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID senderId
    ) {
        return ResponseEntity.ok(senderService.setDefault(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                senderId
        ));
    }
}
