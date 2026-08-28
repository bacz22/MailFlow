package com.mailflow.auth.api;

import com.mailflow.auth.application.result.RefreshResult;
import com.mailflow.auth.application.result.LoginResult;
import com.mailflow.auth.api.request.ForgotPasswordRequest;
import com.mailflow.auth.api.request.LoginRequest;
import com.mailflow.auth.api.response.LoginResponse;
import com.mailflow.auth.api.response.RefreshResponse;
import com.mailflow.auth.api.request.RegisterRequest;
import com.mailflow.auth.api.response.RegisterResponse;
import com.mailflow.auth.api.request.ResendVerificationRequest;
import com.mailflow.auth.api.request.ResetPasswordRequest;
import com.mailflow.auth.api.response.SessionResponse;
import com.mailflow.auth.api.request.VerifyEmailRequest;
import com.mailflow.auth.api.response.VerifyEmailResponse;
import com.mailflow.auth.application.AuthService;
import com.mailflow.auth.application.EmailVerificationService;
import com.mailflow.auth.application.PasswordResetService;
import com.mailflow.auth.application.RefreshTokenService;
import com.mailflow.auth.application.RegistrationService;
import com.mailflow.auth.application.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final RegistrationService registrationService;
    private final EmailVerificationService emailVerificationService;
    private final PasswordResetService passwordResetService;
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final SessionService sessionService;
    private final JwtDecoder jwtDecoder;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = registrationService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<VerifyEmailResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        VerifyEmailResponse response = emailVerificationService.verify(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        registrationService.resendVerification(request);
        return ResponseEntity.ok(Map.of("message", "Mã xác thực mới đã được gửi tới email của bạn."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request);
        return ResponseEntity.ok(Map.of(
                "message",
                "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        ResponseCookie cookie = passwordResetService.resetPassword(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("message", "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại."));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        LoginResult authResult = authService.login(request, httpRequest);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authResult.getCookie().toString())
                .body(authResult.getResponse());
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refresh(
            @CookieValue(name = "${mailflow.auth.refresh-cookie-name:mf_refresh}", required = false) String rawRefreshToken
    ) {
        RefreshResult refreshResult = refreshTokenService.refresh(rawRefreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshResult.getCookie().toString())
                .body(refreshResult.getResponse());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "${mailflow.auth.refresh-cookie-name:mf_refresh}", required = false) String rawRefreshToken,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        ResponseCookie cleanCookie = sessionService.logout(rawRefreshToken, sidFromAuthorization(authorization));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cleanCookie.toString())
                .build();
    }

    private String sidFromAuthorization(String authorization) {
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return null;
        }
        try {
            Jwt jwt = jwtDecoder.decode(authorization.substring(7).trim());
            return jwt.getClaimAsString("sid");
        } catch (JwtException ignored) {
            return null;
        }
    }

    @PostMapping("/logout-all")
    public ResponseEntity<Void> logoutAll(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        ResponseCookie cleanCookie = sessionService.logoutAll(userId);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cleanCookie.toString())
                .build();
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<SessionResponse>> getSessions(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String sidStr = jwt.getClaimAsString("sid");
        UUID currentSessionId = sidStr != null ? UUID.fromString(sidStr) : null;
        return ResponseEntity.ok(sessionService.getSessions(userId, currentSessionId));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> revokeSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String sidStr = jwt.getClaimAsString("sid");
        UUID currentSessionId = sidStr != null ? UUID.fromString(sidStr) : null;
        sessionService.revokeSession(sessionId, userId, currentSessionId);
        return ResponseEntity.noContent().build();
    }
}
