package com.mailflow.auth.application;

import com.mailflow.auth.domain.model.AuthSession;
import com.mailflow.auth.domain.model.RefreshToken;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.model.UserStatus;
import com.mailflow.auth.domain.repository.AuthSessionRepository;
import com.mailflow.auth.domain.repository.RefreshTokenRepository;
import com.mailflow.user.domain.repository.UserRepository;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenRotationService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthSessionRepository authSessionRepository;
    private final UserRepository userRepository;
    private final RefreshTokenGraceCache refreshTokenGraceCache;

    public enum RotationStatus {
        SUCCESS,
        INVALID,
        REUSE_DETECTED,
        SESSION_REVOKED,
        TOKEN_EXPIRED,
        USER_INVALID
    }

    @Getter
    @Builder
    public static class RotationResult {
        private final RotationStatus status;
        private final UUID sessionId;
        private final User user;
        private final AuthSession session;

        public static RotationResult invalid() {
            return RotationResult.builder().status(RotationStatus.INVALID).build();
        }

        public static RotationResult reuseDetected(UUID sessionId) {
            return RotationResult.builder().status(RotationStatus.REUSE_DETECTED).sessionId(sessionId).build();
        }

        public static RotationResult sessionRevoked() {
            return RotationResult.builder().status(RotationStatus.SESSION_REVOKED).build();
        }

        public static RotationResult tokenExpired() {
            return RotationResult.builder().status(RotationStatus.TOKEN_EXPIRED).build();
        }

        public static RotationResult userInvalid(User user) {
            return RotationResult.builder().status(RotationStatus.USER_INVALID).user(user).build();
        }

        public static RotationResult success(User user, AuthSession session) {
            return RotationResult.builder().status(RotationStatus.SUCCESS).user(user).session(session).build();
        }
    }

    /**
     * Thực hiện khóa dòng dữ liệu (Pessimistic Lock) và xoay vòng Refresh Token trong 1 Transaction khép kín.
     * Khi phát hiện reuse sau khi có lock, trả về status REUSE_DETECTED và kết thúc transaction ngay
     * để giải phóng lock trước khi tiến hành revoke.
     */
    @Transactional
    public RotationResult executeRotation(String tokenHash, String newRawToken, String newTokenHash) {
        // 1. Lấy Pessimistic Lock trên dòng refresh_tokens
        RefreshToken currentToken = refreshTokenRepository.findByTokenHashForUpdate(tokenHash)
                .orElse(null);

        if (currentToken == null) {
            return RotationResult.invalid();
        }

        // 2. Kiểm tra trạng thái đã bị Consumed / Revoked ngay SAU KHI CÓ LOCK (Chống Concurrent Race Condition)
        if (currentToken.isConsumed() || currentToken.isRevoked()) {
            return RotationResult.reuseDetected(currentToken.getSessionId());
        }

        // 3. Kiểm tra Session hợp lệ
        AuthSession session = authSessionRepository.findById(currentToken.getSessionId()).orElse(null);
        if (session == null || session.isRevoked() || session.isExpired()) {
            return RotationResult.sessionRevoked();
        }

        // 4. Kiểm tra Token hết hạn
        if (currentToken.isExpired()) {
            return RotationResult.tokenExpired();
        }

        // 5. Kiểm tra User hợp lệ
        User user = userRepository.findById(session.getUserId()).orElse(null);
        if (user == null || user.getStatus() != UserStatus.ACTIVE) {
            return RotationResult.userInvalid(user);
        }

        // 6. Xoay vòng token: Tạo token mới và đánh dấu token cũ consumed
        RefreshToken nextToken = RefreshToken.builder()
                .sessionId(session.getId())
                .tokenHash(newTokenHash)
                .expiresAt(session.getExpiresAt())
                .build();
        RefreshToken savedNextToken = refreshTokenRepository.save(nextToken);

        currentToken.markAsConsumed(savedNextToken.getId());
        refreshTokenRepository.save(currentToken);

        session.setLastActiveAt(Instant.now());
        authSessionRepository.save(session);

        refreshTokenGraceCache.put(tokenHash, newRawToken, session.getId());
        return RotationResult.success(user, session);
    }
}
