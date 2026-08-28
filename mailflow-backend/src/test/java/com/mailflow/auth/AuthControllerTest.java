package com.mailflow.auth;

import com.mailflow.auth.api.AuthController;
import com.mailflow.auth.api.request.LoginRequest;
import com.mailflow.auth.api.response.LoginResponse;
import com.mailflow.auth.application.AuthService;
import com.mailflow.auth.application.EmailVerificationService;
import com.mailflow.auth.application.PasswordResetService;
import com.mailflow.auth.application.RefreshTokenService;
import com.mailflow.auth.application.RegistrationService;
import com.mailflow.auth.application.SessionService;
import com.mailflow.auth.application.result.LoginResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock RegistrationService registrationService;
    @Mock EmailVerificationService emailVerificationService;
    @Mock PasswordResetService passwordResetService;
    @Mock AuthService authService;
    @Mock RefreshTokenService refreshTokenService;
    @Mock SessionService sessionService;
    @Mock JwtDecoder jwtDecoder;
    @InjectMocks AuthController controller;

    @Test
    void login_returnsTokenAndCookie() {
        LoginResponse body = LoginResponse.builder().accessToken("access-token").tokenType("Bearer").build();
        ResponseCookie cookie = ResponseCookie.from("mf_refresh", "raw-refresh").httpOnly(true).build();
        when(authService.login(any(LoginRequest.class), any())).thenReturn(new LoginResult(body, cookie));

        ResponseEntity<LoginResponse> response = controller.login(
                LoginRequest.builder().email("user@mailflow.dev").password("Password123!").build(), null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst("Set-Cookie")).contains("mf_refresh");
        assertThat(response.getBody()).isSameAs(body);
    }
}
