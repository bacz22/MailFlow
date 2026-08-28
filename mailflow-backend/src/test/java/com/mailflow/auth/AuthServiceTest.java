package com.mailflow.auth;

import com.mailflow.auth.api.request.LoginRequest;
import com.mailflow.auth.application.AuthService;
import com.mailflow.auth.application.result.LoginResult;
import com.mailflow.auth.domain.model.AuthSession;
import com.mailflow.auth.domain.repository.AuthSessionRepository;
import com.mailflow.auth.domain.repository.RefreshTokenRepository;
import com.mailflow.auth.infrastructure.cookie.AuthCookieService;
import com.mailflow.auth.infrastructure.jwt.AccessTokenService;
import com.mailflow.auth.infrastructure.jwt.JwtProperties;
import com.mailflow.auth.infrastructure.token.SecureTokenGenerator;
import com.mailflow.common.exception.AppException;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.model.UserStatus;
import com.mailflow.user.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock AuthSessionRepository sessionRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtProperties jwtProperties;
    @Mock AccessTokenService accessTokenService;
    @Mock SecureTokenGenerator tokenGenerator;
    @Mock AuthCookieService cookieService;
    @InjectMocks AuthService authService;

    @Test
    void login_success() {
        User user = activeUser();
        LoginRequest request = LoginRequest.builder().email(user.getEmail())
                .password("Password123!").rememberMe(false).build();
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123!", user.getPassword())).thenReturn(true);
        when(jwtProperties.getRefreshTokenTtl()).thenReturn(Duration.ofDays(7));
        when(jwtProperties.getAccessTokenTtl()).thenReturn(Duration.ofMinutes(15));
        when(sessionRepository.save(any())).thenAnswer(invocation -> {
            AuthSession session = invocation.getArgument(0);
            session.setId(UUID.randomUUID());
            return session;
        });
        when(tokenGenerator.generateRawToken()).thenReturn("raw-refresh");
        when(tokenGenerator.hashToken("raw-refresh")).thenReturn("hash-refresh");
        when(accessTokenService.issueAccessToken(eq(user), any())).thenReturn("access-token");
        when(cookieService.createRefreshCookie(eq("raw-refresh"), any()))
                .thenReturn(ResponseCookie.from("mf_refresh", "raw-refresh").build());

        LoginResult result = authService.login(request, null);

        assertThat(result.getResponse().getAccessToken()).isEqualTo("access-token");
        assertThat(result.getResponse().getUser().getEmail()).isEqualTo(user.getEmail());
        ArgumentCaptor<AuthSession> sessionCaptor = ArgumentCaptor.forClass(AuthSession.class);
        verify(sessionRepository).save(sessionCaptor.capture());
        assertThat(sessionCaptor.getValue().getIpAddress()).isEqualTo("127.0.0.1");
    }

    @Test
    void login_storesClientIpFromForwardedHeader() {
        User user = activeUser();
        LoginRequest request = LoginRequest.builder().email(user.getEmail())
                .password("Password123!").rememberMe(false).build();
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123!", user.getPassword())).thenReturn(true);
        when(jwtProperties.getRefreshTokenTtl()).thenReturn(Duration.ofDays(7));
        when(jwtProperties.getAccessTokenTtl()).thenReturn(Duration.ofMinutes(15));
        when(sessionRepository.save(any())).thenAnswer(invocation -> {
            AuthSession session = invocation.getArgument(0);
            session.setId(UUID.randomUUID());
            return session;
        });
        when(tokenGenerator.generateRawToken()).thenReturn("raw-refresh");
        when(tokenGenerator.hashToken("raw-refresh")).thenReturn("hash-refresh");
        when(accessTokenService.issueAccessToken(eq(user), any())).thenReturn("access-token");
        when(cookieService.createRefreshCookie(eq("raw-refresh"), any()))
                .thenReturn(ResponseCookie.from("mf_refresh", "raw-refresh").build());

        MockHttpServletRequest httpRequest = new MockHttpServletRequest();
        httpRequest.setRemoteAddr("10.0.0.8");
        httpRequest.addHeader("X-Forwarded-For", "203.0.113.50");
        httpRequest.addHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0");

        authService.login(request, httpRequest);

        ArgumentCaptor<AuthSession> sessionCaptor = ArgumentCaptor.forClass(AuthSession.class);
        verify(sessionRepository).save(sessionCaptor.capture());
        assertThat(sessionCaptor.getValue().getIpAddress()).isEqualTo("203.0.113.50");
        assertThat(sessionCaptor.getValue().getBrowser()).isEqualTo("Google Chrome");
    }

    @Test
    void login_wrongPassword_rejected() {
        User user = activeUser();
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", user.getPassword())).thenReturn(false);
        LoginRequest request = LoginRequest.builder().email(user.getEmail()).password("wrong").build();

        assertThatThrownBy(() -> authService.login(request, null))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("code", "INVALID_CREDENTIALS");
    }

    private static User activeUser() {
        User user = new User("active@mailflow.dev", "password-hash", "Van", "Nguyen");
        user.setId(UUID.randomUUID());
        user.setStatus(UserStatus.ACTIVE);
        return user;
    }
}
