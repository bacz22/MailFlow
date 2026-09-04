package com.mailflow.sendingdomain.api;

import com.mailflow.sendingdomain.api.request.CreateSendingDomainRequest;
import com.mailflow.sendingdomain.api.response.SendingDomainResponse;
import com.mailflow.sendingdomain.application.SendingDomainService;
import com.mailflow.workspace.application.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/domains")
@RequiredArgsConstructor
public class SendingDomainController {

    private final SendingDomainService domainService;

    @GetMapping
    public ResponseEntity<List<SendingDomainResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(domainService.list(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                q,
                status
        ));
    }

    @PostMapping
    public ResponseEntity<SendingDomainResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateSendingDomainRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(domainService.create(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                request
        ));
    }

    @GetMapping("/{domainId}")
    public ResponseEntity<SendingDomainResponse> get(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID domainId
    ) {
        return ResponseEntity.ok(domainService.get(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                domainId
        ));
    }

    @DeleteMapping("/{domainId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID domainId
    ) {
        domainService.delete(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                domainId
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{domainId}/verify")
    public ResponseEntity<SendingDomainResponse> verify(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID domainId
    ) {
        return ResponseEntity.ok(domainService.verify(
                UUID.fromString(jwt.getSubject()),
                WorkspaceService.requireCurrentWorkspaceId(jwt),
                domainId
        ));
    }
}
