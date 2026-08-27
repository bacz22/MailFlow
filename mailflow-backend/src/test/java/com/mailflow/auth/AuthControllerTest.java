package com.mailflow.auth;

import com.mailflow.auth.controller.AuthController;
import com.mailflow.auth.dto.AuthRefreshResult;
import com.mailflow.auth.dto.AuthResult;
import com.mailflow.auth.dto.LoginRequest;
import com.mailflow.auth.dto.LoginResponse;
import com.mailflow.auth.dto.RefreshResponse;
import com.mailflow.auth.dto.RegisterRequest;
import com.mailflow.auth.dto.RegisterResponse;
import com.mailflow.auth.dto.ResendVerificationRequest;
import com.mailflow.auth.dto.SessionResponse;
import com.mailflow.auth.dto.UserSummaryDto;
import com.mailflow.auth.dto.VerifyEmailRequest;
import com.mailflow.auth.dto.VerifyEmailResponse;
import com.mailflow.auth.service.IAuthService;
import com.mailflow.entity.UserStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private IAuthService authService;

    @InjectMocks
    private AuthController authController;

    @Test
    @DisplayName("POST /api/v1/auth/register thành công -> Trả về 201 Created và dữ liệu người dùng")
    void register_success() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("Nguyen")
                .lastName("Van A")
                .email("test@mailflow.dev")
                .password("Password123!")
                .confirmPassword("Password123!")
                .acceptTerms(true)
                .build();

        RegisterResponse mockResponse = RegisterResponse.builder()
                .id(UUID.randomUUID())
                .email("test@mailflow.dev")
                .firstName("Nguyen")
                .lastName("Van A")
                .status(UserStatus.PENDING)
                .roles(Set.of("ROLE_OWNER"))
                .message("Đăng ký tài khoản thành công.")
                .createdAt(Instant.now())
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(mockResponse);

        ResponseEntity<RegisterResponse> response = authController.register(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getEmail()).isEqualTo("test@mailflow.dev");
        assertThat(response.getBody().getStatus()).isEqualTo(UserStatus.PENDING);
        assertThat(response.getBody().getRoles()).contains("ROLE_OWNER");
    }

    @Test
    @DisplayName("POST /api/v1/auth/verify-email thành công -> Trả về 200 OK")
    void verifyEmail_success() {
        VerifyEmailRequest request = new VerifyEmailRequest("valid_token_xyz");
        VerifyEmailResponse mockResponse = VerifyEmailResponse.builder()
                .email("test@mailflow.dev")
                .status(UserStatus.ACTIVE)
                .message("Tài khoản của bạn đã được kích hoạt thành công!")
                .build();

        when(authService.verifyEmail(any(VerifyEmailRequest.class))).thenReturn(mockResponse);

        ResponseEntity<VerifyEmailResponse> response = authController.verifyEmail(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getEmail()).isEqualTo("test@mailflow.dev");
        assertThat(response.getBody().getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    @DisplayName("POST /api/v1/auth/resend-verification thành công -> Trả về 200 OK")
    void resendVerification_success() {
        ResendVerificationRequest request = new ResendVerificationRequest("test@mailflow.dev");

        ResponseEntity<Map<String, String>> response = authController.resendVerification(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("message")).isNotBlank();
        verify(authService).resendVerification(request);
    }

    @Test
    @DisplayName("POST /api/v1/auth/login thành công -> Trả về 200 OK, Access Token và Set-Cookie mf_refresh")
    void login_success() {
        LoginRequest request = LoginRequest.builder()
                .email("user@mailflow.dev")
                .password("Password123!")
                .rememberMe(true)
                .build();

        LoginResponse loginResponse = LoginResponse.builder()
                .accessToken("access_token_sample")
                .tokenType("Bearer")
                .expiresIn(900)
                .user(UserSummaryDto.builder()
                        .id(UUID.randomUUID())
                        .email("user@mailflow.dev")
                        .firstName("Van")
                        .lastName("Nguyen")
                        .status(UserStatus.ACTIVE)
                        .build())
                .build();

        ResponseCookie cookie = ResponseCookie.from("mf_refresh", "raw_refresh_token_123")
                .httpOnly(true)
                .path("/api/v1/auth")
                .build();

        when(authService.login(any(LoginRequest.class), any())).thenReturn(new AuthResult(loginResponse, cookie));

        ResponseEntity<LoginResponse> response = authController.login(request, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst(HttpHeaders.SET_COOKIE)).contains("mf_refresh=raw_refresh_token_123");
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getAccessToken()).isEqualTo("access_token_sample");
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh thành công -> Trả về 200 OK và xoay vòng cookie mới")
    void refresh_success() {
        RefreshResponse refreshResponse = RefreshResponse.builder()
                .accessToken("new_access_token_sample")
                .tokenType("Bearer")
                .expiresIn(900)
                .build();

        ResponseCookie cookie = ResponseCookie.from("mf_refresh", "new_raw_refresh_token")
                .httpOnly(true)
                .path("/api/v1/auth")
                .build();

        when(authService.refresh(eq("raw_cookie_val"), any())).thenReturn(new AuthRefreshResult(refreshResponse, cookie));

        ResponseEntity<RefreshResponse> response = authController.refresh("raw_cookie_val", null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst(HttpHeaders.SET_COOKIE)).contains("mf_refresh=new_raw_refresh_token");
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getAccessToken()).isEqualTo("new_access_token_sample");
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout thành công -> Trả về 204 No Content và xóa cookie")
    void logout_success() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("sid")).thenReturn(UUID.randomUUID().toString());

        ResponseCookie cleanCookie = ResponseCookie.from("mf_refresh", "")
                .maxAge(0)
                .build();

        when(authService.logout(any())).thenReturn(cleanCookie);

        ResponseEntity<Void> response = authController.logout(jwt);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getHeaders().getFirst(HttpHeaders.SET_COOKIE)).contains("Max-Age=0");
    }

    @Test
    @DisplayName("GET /api/v1/auth/sessions -> Trả về danh sách phiên của user")
    void getSessions_success() {
        UUID userId = UUID.randomUUID();
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
        when(jwt.getClaimAsString("sid")).thenReturn(UUID.randomUUID().toString());

        List<SessionResponse> mockSessions = List.of(
                SessionResponse.builder()
                        .id(UUID.randomUUID())
                        .device("Desktop")
                        .browser("Google Chrome")
                        .operatingSystem("Windows 10/11")
                        .ipAddress("127.0.0.1")
                        .lastActiveAt(Instant.now())
                        .createdAt(Instant.now())
                        .isCurrent(true)
                        .build()
        );

        when(authService.getSessions(eq(userId), any())).thenReturn(mockSessions);

        ResponseEntity<List<SessionResponse>> response = authController.getSessions(jwt);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getBrowser()).isEqualTo("Google Chrome");
    }
}
