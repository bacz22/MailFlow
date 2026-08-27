package com.mailflow.auth;

import com.mailflow.auth.service.AuthSessionRevocationService;
import com.mailflow.auth.service.RefreshTokenGenerator;
import com.mailflow.auth.service.impl.AuthService;
import com.mailflow.common.exception.AppException;
import com.mailflow.entity.AuthSession;
import com.mailflow.entity.RefreshToken;
import com.mailflow.entity.User;
import com.mailflow.entity.UserStatus;
import com.mailflow.repository.AuthSessionRepository;
import com.mailflow.repository.RefreshTokenRepository;
import com.mailflow.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class AuthSessionRevocationIntegrationTest {

    @Autowired
    private AuthSessionRepository authSessionRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenGenerator refreshTokenGenerator;

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("Tích hợp DB: Khi phát hiện token reuse, việc revoke Session PHẢI được commit vào DB dù AuthService ném RuntimeException")
    void refresh_tokenReuse_persistsRevocationInDatabase() {
        String testEmail = "reuse." + UUID.randomUUID() + "@mailflow.dev";

        // 1. Tạo user & session trong database
        User user = new User(testEmail, "passwordHash", "Test", "User");
        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.save(user);

        AuthSession session = AuthSession.builder()
                .userId(user.getId())
                .device("Desktop")
                .browser("Chrome")
                .operatingSystem("Windows")
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();
        session = authSessionRepository.save(session);

        String rawToken = "raw_test_reuse_token_" + UUID.randomUUID();
        String tokenHash = refreshTokenGenerator.hashToken(rawToken);

        RefreshToken consumedToken = RefreshToken.builder()
                .sessionId(session.getId())
                .tokenHash(tokenHash)
                .consumedAt(Instant.now().minus(10, ChronoUnit.MINUTES)) // Đã bị consumed trước đó
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();
        consumedToken = refreshTokenRepository.save(consumedToken);

        final UUID sessionId = session.getId();
        final UUID tokenId = consumedToken.getId();

        // 2. Gọi refresh() với token đã bị consumed -> Phải ném AppException REFRESH_TOKEN_REUSE_DETECTED
        assertThatThrownBy(() -> authService.refresh(rawToken, null))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("code", "REFRESH_TOKEN_REUSE_DETECTED");

        // 3. Đọc lại DB để khẳng định thay đổi revoke đã được COMMIT vĩnh viễn (không bị rollback)
        AuthSession reloadedSession = authSessionRepository.findById(sessionId).orElseThrow();
        RefreshToken reloadedToken = refreshTokenRepository.findById(tokenId).orElseThrow();

        assertThat(reloadedSession.isRevoked()).isTrue();
        assertThat(reloadedSession.getRevokeReason()).isEqualTo("REUSE_DETECTED");
        assertThat(reloadedToken.isRevoked()).isTrue();
        assertThat(reloadedToken.getRevokeReason()).isEqualTo("REUSE_DETECTED");
    }
}
