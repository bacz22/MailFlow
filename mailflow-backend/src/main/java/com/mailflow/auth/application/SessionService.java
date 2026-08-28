package com.mailflow.auth.application;

import com.mailflow.auth.api.response.SessionResponse;
import com.mailflow.auth.domain.model.AuthSession;
import com.mailflow.auth.domain.model.RefreshToken;
import com.mailflow.auth.domain.repository.AuthSessionRepository;
import com.mailflow.auth.domain.repository.RefreshTokenRepository;
import com.mailflow.auth.infrastructure.cookie.AuthCookieService;
import com.mailflow.auth.infrastructure.token.SecureTokenGenerator;
import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private final AuthSessionRepository sessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureTokenGenerator tokenGenerator;
    private final AuthCookieService cookieService;
    private final AuthSessionStatusService statusService;

    @Transactional
    public ResponseCookie logout(String rawRefreshToken, String sid) {
        UUID sessionId = resolveSessionId(rawRefreshToken, sid);
        if (sessionId != null) {
            revokeSessionData(sessionId, "USER_LOGOUT");
            log.info("Đã đăng xuất và thu hồi session [{}]", sessionId);
        }
        return cookieService.createCleanRefreshCookie();
    }

    @Transactional
    public ResponseCookie logoutAll(UUID userId) {
        return revokeAllSessions(userId, "USER_LOGOUT_ALL");
    }

    @Transactional
    public ResponseCookie revokeAllSessions(UUID userId, String reason) {
        List<AuthSession> sessions = sessionRepository.findAllByUserId(userId);
        sessions.forEach(session -> {
            session.revoke(reason);
            revokeTokens(session.getId(), reason);
        });
        sessionRepository.saveAll(sessions);
        statusService.invalidateAll(sessions.stream().map(AuthSession::getId).toList());
        return cookieService.createCleanRefreshCookie();
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> getSessions(UUID userId, UUID currentSessionId) {
        return sessionRepository.findAllByUserIdAndRevokedAtIsNullOrderByLastActiveAtDesc(userId).stream()
                .filter(session -> !session.isExpired())
                .map(session -> SessionResponse.builder().id(session.getId()).device(session.getDevice())
                        .browser(session.getBrowser()).operatingSystem(session.getOperatingSystem())
                        .ipAddress(session.getIpAddress()).lastActiveAt(session.getLastActiveAt())
                        .createdAt(session.getCreatedAt())
                        .current(currentSessionId != null && session.getId().equals(currentSessionId))
                        .build())
                .toList();
    }

    @Transactional
    public void revokeSession(UUID sessionId, UUID userId, UUID currentSessionId) {
        if (currentSessionId != null && currentSessionId.equals(sessionId)) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "CANNOT_REVOKE_CURRENT_SESSION",
                    "Không thể đăng xuất thiết bị hiện tại. Hãy dùng Đăng xuất ở menu tài khoản."
            );
        }
        AuthSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên đăng nhập", sessionId.toString()));
        session.revoke("USER_REVOKED");
        sessionRepository.save(session);
        revokeTokens(sessionId, "USER_REVOKED");
        statusService.invalidate(sessionId);
    }

    private UUID resolveSessionId(String rawRefreshToken, String sid) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            Optional<RefreshToken> token = refreshTokenRepository
                    .findByTokenHash(tokenGenerator.hashToken(rawRefreshToken));
            if (token.isPresent()) return token.get().getSessionId();
        }
        try {
            return sid == null || sid.isBlank() ? null : UUID.fromString(sid);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private void revokeSessionData(UUID sessionId, String reason) {
        sessionRepository.findById(sessionId).ifPresent(session -> {
            session.revoke(reason);
            sessionRepository.save(session);
        });
        revokeTokens(sessionId, reason);
        statusService.invalidate(sessionId);
    }

    private void revokeTokens(UUID sessionId, String reason) {
        List<RefreshToken> tokens = refreshTokenRepository.findAllBySessionId(sessionId);
        tokens.forEach(token -> token.revoke(reason));
        refreshTokenRepository.saveAll(tokens);
    }
}
