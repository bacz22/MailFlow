package com.mailflow.auth;

import com.mailflow.auth.dto.AuthRefreshResult;
import com.mailflow.auth.dto.AuthResult;
import com.mailflow.auth.dto.LoginRequest;
import com.mailflow.auth.dto.RegisterRequest;
import com.mailflow.auth.dto.RegisterResponse;
import com.mailflow.auth.dto.ResendVerificationRequest;
import com.mailflow.auth.dto.VerifyEmailRequest;
import com.mailflow.auth.dto.VerifyEmailResponse;
import com.mailflow.auth.event.UserRegisteredEvent;
import com.mailflow.auth.service.AccessTokenService;
import com.mailflow.auth.service.AuthCookieService;
import com.mailflow.auth.service.AuthSessionRevocationService;
import com.mailflow.auth.service.RefreshTokenGenerator;
import com.mailflow.auth.service.RefreshTokenRotationService;
import com.mailflow.auth.service.RefreshTokenRotationService.RotationResult;
import com.mailflow.auth.service.impl.AuthService;
import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.EmailAlreadyExistsException;
import com.mailflow.config.security.JwtProperties;
import com.mailflow.entity.AuthSession;
import com.mailflow.entity.OneTimeToken;
import com.mailflow.entity.OneTimeTokenPurpose;
import com.mailflow.entity.RefreshToken;
import com.mailflow.entity.Role;
import com.mailflow.entity.User;
import com.mailflow.entity.UserStatus;
import com.mailflow.repository.AuthSessionRepository;
import com.mailflow.repository.OneTimeTokenRepository;
import com.mailflow.repository.RefreshTokenRepository;
import com.mailflow.repository.RoleRepository;
import com.mailflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private OneTimeTokenRepository oneTimeTokenRepository;

    @Mock
    private AuthSessionRepository authSessionRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private RefreshTokenRotationService refreshTokenRotationService;

    @Mock
    private AuthSessionRevocationService authSessionRevocationService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private JwtProperties jwtProperties;

    @Mock
    private AccessTokenService accessTokenService;

    @Mock
    private RefreshTokenGenerator refreshTokenGenerator;

    @Mock
    private AuthCookieService authCookieService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest validRequest;
    private Role defaultRole;

    @BeforeEach
    void setUp() {
        validRequest = RegisterRequest.builder()
                .firstName("Nguyen")
                .lastName("Van A")
                .email("test.user@mailflow.dev")
                .password("SecurePass123!")
                .confirmPassword("SecurePass123!")
                .acceptTerms(true)
                .build();

        defaultRole = new Role("ROLE_OWNER", "Owner role");
    }

    @Test
    @DisplayName("Đăng ký thành công -> User được lưu với trạng thái PENDING, gán ROLE_OWNER, tạo token và phát UserRegisteredEvent")
    void register_success() {
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(roleRepository.findByNameIgnoreCase("ROLE_OWNER")).thenReturn(Optional.of(defaultRole));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password_xyz");
        when(refreshTokenGenerator.generateRawToken()).thenReturn("raw_token_xyz");
        when(refreshTokenGenerator.hashToken("raw_token_xyz")).thenReturn("hash_xyz");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        RegisterResponse response = authService.register(validRequest);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("test.user@mailflow.dev");
        assertThat(response.getFirstName()).isEqualTo("Nguyen");
        assertThat(response.getLastName()).isEqualTo("Van A");
        assertThat(response.getStatus()).isEqualTo(UserStatus.PENDING);
        assertThat(response.getRoles()).contains("ROLE_OWNER");

        verify(userRepository).save(any(User.class));
        verify(oneTimeTokenRepository).save(any(OneTimeToken.class));
        verify(eventPublisher).publishEvent(any(UserRegisteredEvent.class));
    }

    @Test
    @DisplayName("Đăng ký thất bại khi email đã tồn tại -> Ném EmailAlreadyExistsException")
    void register_duplicateEmail_throwsException() {
        when(userRepository.existsByEmailIgnoreCase(validRequest.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(validRequest))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessageContaining(validRequest.getEmail());

        verify(userRepository, never()).save(any(User.class));
        verify(oneTimeTokenRepository, never()).save(any(OneTimeToken.class));
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("Xác thực email thành công -> Cập nhật User status = ACTIVE và emailVerifiedAt")
    void verifyEmail_success() {
        UUID userId = UUID.randomUUID();
        User pendingUser = new User("user@mailflow.dev", "hash", "Van", "Nguyen");
        pendingUser.setId(userId);
        pendingUser.setStatus(UserStatus.PENDING);

        OneTimeToken validToken = new OneTimeToken(
                userId,
                OneTimeTokenPurpose.EMAIL_VERIFICATION,
                "dummy_hash",
                Instant.now().plus(24, ChronoUnit.HOURS)
        );

        when(refreshTokenGenerator.hashToken("raw_token_xyz")).thenReturn("dummy_hash");
        when(oneTimeTokenRepository.findByTokenHashAndPurpose("dummy_hash", OneTimeTokenPurpose.EMAIL_VERIFICATION))
                .thenReturn(Optional.of(validToken));
        when(userRepository.findById(userId)).thenReturn(Optional.of(pendingUser));

        VerifyEmailResponse response = authService.verifyEmail(new VerifyEmailRequest("raw_token_xyz"));

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("user@mailflow.dev");
        assertThat(response.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(pendingUser.isEmailVerified()).isTrue();
        assertThat(validToken.isConsumed()).isTrue();
    }

    @Test
    @DisplayName("Đăng nhập thành công -> Trả về Access Token và Set HttpOnly Cookie")
    void login_success() {
        UUID userId = UUID.randomUUID();
        User activeUser = new User("active@mailflow.dev", "hashed_pwd", "Van A", "Nguyen");
        activeUser.setId(userId);
        activeUser.setStatus(UserStatus.ACTIVE);

        LoginRequest loginRequest = LoginRequest.builder()
                .email("active@mailflow.dev")
                .password("Password123!")
                .rememberMe(false)
                .build();

        when(userRepository.findByEmailIgnoreCase("active@mailflow.dev")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("Password123!", "hashed_pwd")).thenReturn(true);
        when(jwtProperties.getRefreshTokenTtl()).thenReturn(Duration.ofDays(7));
        when(jwtProperties.getAccessTokenTtl()).thenReturn(Duration.ofMinutes(15));
        when(authSessionRepository.save(any(AuthSession.class))).thenAnswer(invocation -> {
            AuthSession s = invocation.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });
        when(refreshTokenGenerator.generateRawToken()).thenReturn("raw_refresh_123");
        when(refreshTokenGenerator.hashToken("raw_refresh_123")).thenReturn("hash_refresh_123");
        when(accessTokenService.issueAccessToken(eq(activeUser), any(UUID.class))).thenReturn("access_token_jwt");
        when(authCookieService.createRefreshCookie(eq("raw_refresh_123"), any(Duration.class)))
                .thenReturn(ResponseCookie.from("mf_refresh", "raw_refresh_123").build());

        AuthResult result = authService.login(loginRequest, null);

        assertThat(result).isNotNull();
        assertThat(result.getResponse().getAccessToken()).isEqualTo("access_token_jwt");
        assertThat(result.getResponse().getUser().getEmail()).isEqualTo("active@mailflow.dev");
        verify(authSessionRepository).save(any(AuthSession.class));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Đăng nhập sai mật khẩu -> Ném AppException INVALID_CREDENTIALS")
    void login_wrongPassword_throwsException() {
        User activeUser = new User("active@mailflow.dev", "hashed_pwd", "Van A", "Nguyen");
        activeUser.setStatus(UserStatus.ACTIVE);

        LoginRequest loginRequest = LoginRequest.builder()
                .email("active@mailflow.dev")
                .password("WrongPassword")
                .build();

        when(userRepository.findByEmailIgnoreCase("active@mailflow.dev")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("WrongPassword", "hashed_pwd")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(loginRequest, null))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("code", "INVALID_CREDENTIALS");
    }

    @Test
    @DisplayName("Đăng nhập khi tài khoản chưa kích hoạt (PENDING) -> Ném AppException EMAIL_NOT_VERIFIED")
    void login_pendingAccount_throwsException() {
        User pendingUser = new User("pending@mailflow.dev", "hashed_pwd", "Van A", "Nguyen");
        pendingUser.setStatus(UserStatus.PENDING);

        LoginRequest loginRequest = LoginRequest.builder()
                .email("pending@mailflow.dev")
                .password("Password123!")
                .build();

        when(userRepository.findByEmailIgnoreCase("pending@mailflow.dev")).thenReturn(Optional.of(pendingUser));
        when(passwordEncoder.matches("Password123!", "hashed_pwd")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(loginRequest, null))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("code", "EMAIL_NOT_VERIFIED");
    }

    @Test
    @DisplayName("Refresh Token thành công -> Xoay vòng token cũ và cấp token mới (RTR)")
    void refresh_success() {
        UUID sessionId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        User user = new User("user@mailflow.dev", "pwd", "Van", "Nguyen");
        user.setId(userId);
        user.setStatus(UserStatus.ACTIVE);

        AuthSession session = AuthSession.builder()
                .id(sessionId)
                .userId(userId)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();

        when(refreshTokenGenerator.hashToken("raw_old_token")).thenReturn("old_hash");
        when(refreshTokenGenerator.generateRawToken()).thenReturn("raw_new_token");
        when(refreshTokenGenerator.hashToken("raw_new_token")).thenReturn("new_hash");

        when(refreshTokenRotationService.executeRotation("old_hash", "raw_new_token", "new_hash"))
                .thenReturn(RotationResult.success(user, session));

        when(accessTokenService.issueAccessToken(eq(user), eq(sessionId))).thenReturn("new_access_token_jwt");
        when(jwtProperties.getAccessTokenTtl()).thenReturn(Duration.ofMinutes(15));
        when(authCookieService.createRefreshCookie(eq("raw_new_token"), any(Duration.class)))
                .thenReturn(ResponseCookie.from("mf_refresh", "raw_new_token").build());

        AuthRefreshResult refreshResult = authService.refresh("raw_old_token", null);

        assertThat(refreshResult).isNotNull();
        assertThat(refreshResult.getResponse().getAccessToken()).isEqualTo("new_access_token_jwt");
    }

    @Test
    @DisplayName("Phát hiện Refresh Token cũ bị dùng lại (Reuse Detection) -> Gọi AuthSessionRevocationService thu hồi session")
    void refresh_reuseDetected_revokesSession() {
        UUID sessionId = UUID.randomUUID();

        when(refreshTokenGenerator.hashToken("raw_consumed_token")).thenReturn("consumed_hash");
        when(refreshTokenGenerator.generateRawToken()).thenReturn("raw_new_token");
        when(refreshTokenGenerator.hashToken("raw_new_token")).thenReturn("new_hash");

        when(refreshTokenRotationService.executeRotation("consumed_hash", "raw_new_token", "new_hash"))
                .thenReturn(RotationResult.reuseDetected(sessionId));

        assertThatThrownBy(() -> authService.refresh("raw_consumed_token", null))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("code", "REFRESH_TOKEN_REUSE_DETECTED");

        verify(authSessionRevocationService).revokeCompromisedSession(sessionId, "REUSE_DETECTED");
    }
}
