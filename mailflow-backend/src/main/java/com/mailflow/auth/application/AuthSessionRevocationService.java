package com.mailflow.auth.application;

import com.mailflow.auth.domain.model.AuthSession;
import com.mailflow.auth.domain.model.RefreshToken;
import com.mailflow.auth.domain.repository.AuthSessionRepository;
import com.mailflow.auth.domain.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthSessionRevocationService {

    private final AuthSessionRepository authSessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthSessionStatusService authSessionStatusService;

    /**
     * Thu hồi phiên bị lộ và toàn bộ token liên quan trong một Transaction riêng biệt (REQUIRES_NEW).
     * Điều này đảm bảo việc thu hồi được COMMIT vào Database ngay cả khi caller throw Exception.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void revokeCompromisedSession(UUID sessionId, String reason) {
        log.warn("🚨 [SECURITY ALERT] Thu hồi vĩnh viễn Session [{}] và toàn bộ Refresh Tokens với lý do: [{}]", sessionId, reason);

        authSessionRepository.findById(sessionId).ifPresent(session -> {
            session.revoke(reason);
            authSessionRepository.save(session);
        });

        List<RefreshToken> tokens = refreshTokenRepository.findAllBySessionId(sessionId);
        for (RefreshToken token : tokens) {
            token.revoke(reason);
        }
        refreshTokenRepository.saveAll(tokens);
        authSessionStatusService.invalidate(sessionId);
    }
}
