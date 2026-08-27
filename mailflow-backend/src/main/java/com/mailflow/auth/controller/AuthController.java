package com.mailflow.auth.controller;

import com.mailflow.auth.dto.AuthRefreshResult;
import com.mailflow.auth.dto.AuthResult;
import com.mailflow.auth.dto.LoginRequest;
import com.mailflow.auth.dto.LoginResponse;
import com.mailflow.auth.dto.RefreshResponse;
import com.mailflow.auth.dto.RegisterRequest;
import com.mailflow.auth.dto.RegisterResponse;
import com.mailflow.auth.dto.ResendVerificationRequest;
import com.mailflow.auth.dto.SessionResponse;
import com.mailflow.auth.dto.VerifyEmailRequest;
import com.mailflow.auth.dto.VerifyEmailResponse;
import com.mailflow.auth.service.IAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IAuthService authService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<VerifyEmailResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        VerifyEmailResponse response = authService.verifyEmail(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request);
        return ResponseEntity.ok(Map.of("message", "Mã xác thực mới đã được gửi tới email của bạn."));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        AuthResult authResult = authService.login(request, httpRequest);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authResult.getCookie().toString())
                .body(authResult.getResponse());
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refresh(
            @CookieValue(name = "${mailflow.auth.refresh-cookie-name:mf_refresh}", required = false) String rawRefreshToken,
            HttpServletRequest httpRequest
    ) {
        AuthRefreshResult refreshResult = authService.refresh(rawRefreshToken, httpRequest);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshResult.getCookie().toString())
                .body(refreshResult.getResponse());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal Jwt jwt) {
        String sid = jwt != null ? jwt.getClaimAsString("sid") : null;
        ResponseCookie cleanCookie = authService.logout(sid);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cleanCookie.toString())
                .build();
    }

    @PostMapping("/logout-all")
    public ResponseEntity<Void> logoutAll(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        ResponseCookie cleanCookie = authService.logoutAll(userId);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cleanCookie.toString())
                .build();
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<SessionResponse>> getSessions(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String sidStr = jwt.getClaimAsString("sid");
        UUID currentSessionId = sidStr != null ? UUID.fromString(sidStr) : null;
        return ResponseEntity.ok(authService.getSessions(userId, currentSessionId));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> revokeSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        authService.revokeSession(sessionId, userId);
        return ResponseEntity.noContent().build();
    }
}
