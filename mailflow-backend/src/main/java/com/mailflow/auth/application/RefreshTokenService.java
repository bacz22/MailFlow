package com.mailflow.auth.application;

import com.mailflow.auth.api.response.RefreshResponse;
import com.mailflow.auth.application.RefreshTokenGraceCache.GraceEntry;
import com.mailflow.auth.application.RefreshTokenRotationService.RotationResult;
import com.mailflow.auth.application.RefreshTokenRotationService.RotationStatus;
import com.mailflow.auth.application.result.RefreshResult;
import com.mailflow.auth.domain.model.AuthSession;
import com.mailflow.auth.domain.repository.AuthSessionRepository;
import com.mailflow.auth.infrastructure.cookie.AuthCookieService;
import com.mailflow.auth.infrastructure.jwt.AccessTokenService;
import com.mailflow.auth.infrastructure.jwt.JwtProperties;
import com.mailflow.auth.infrastructure.token.SecureTokenGenerator;
import com.mailflow.common.exception.AppException;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRotationService rotationService;
    private final AuthSessionRevocationService revocationService;
    private final RefreshTokenGraceCache graceCache;
    private final AuthSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SecureTokenGenerator tokenGenerator;
    private final AccessTokenService accessTokenService;
    private final AuthCookieService cookieService;
    private final JwtProperties jwtProperties;

    public RefreshResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw error("REFRESH_TOKEN_MISSING", "Không tìm thấy refresh token trong yêu cầu.");
        }

        String tokenHash = tokenGenerator.hashToken(rawRefreshToken);
        String newRawToken = tokenGenerator.generateRawToken();
        RotationResult result = rotationService.executeRotation(
                tokenHash, newRawToken, tokenGenerator.hashToken(newRawToken));

        if (result.getStatus() == RotationStatus.REUSE_DETECTED) {
            Optional<GraceEntry> graceEntry = graceCache.getValid(tokenHash, result.getSessionId());
            if (graceEntry.isPresent()) {
                return replayGraceRefresh(graceEntry.get());
            }
            revocationService.revokeCompromisedSession(result.getSessionId(), "REUSE_DETECTED");
            throw error("REFRESH_TOKEN_REUSE_DETECTED",
                    "Phát hiện refresh token đã được sử dụng. Toàn bộ phiên đã bị thu hồi.");
        }
        if (result.getStatus() == RotationStatus.INVALID) {
            throw error("REFRESH_TOKEN_INVALID", "Refresh token không hợp lệ hoặc không tồn tại.");
        }
        if (result.getStatus() == RotationStatus.SESSION_REVOKED) {
            throw error("SESSION_REVOKED", "Phiên đăng nhập đã bị thu hồi hoặc hết hạn.");
        }
        if (result.getStatus() == RotationStatus.TOKEN_EXPIRED) {
            throw error("REFRESH_TOKEN_EXPIRED", "Refresh token đã hết hạn.");
        }
        if (result.getStatus() == RotationStatus.USER_INVALID) {
            if (result.getUser() == null) {
                throw error("INVALID_CREDENTIALS", "Người dùng không tồn tại.");
            }
            UserStatusPolicy.requireActive(result.getUser());
            throw error("USER_INVALID", "Tài khoản không hợp lệ.");
        }
        return issueTokens(result.getUser(), result.getSession(), newRawToken);
    }

    private RefreshResult replayGraceRefresh(GraceEntry entry) {
        AuthSession session = sessionRepository.findById(entry.sessionId())
                .filter(AuthSession::isActive)
                .orElseThrow(() -> error("SESSION_REVOKED", "Phiên đăng nhập đã bị thu hồi hoặc hết hạn."));
        User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> error("INVALID_CREDENTIALS", "Người dùng không tồn tại."));
        UserStatusPolicy.requireActive(user);
        return issueTokens(user, session, entry.newRawToken());
    }

    private RefreshResult issueTokens(User user, AuthSession session, String rawRefreshToken) {
        String accessToken = accessTokenService.issueAccessToken(user, session.getId());
        Duration remainingTtl = Duration.between(Instant.now(), session.getExpiresAt());
        ResponseCookie cookie = cookieService.createRefreshCookie(rawRefreshToken,
                remainingTtl.isNegative() ? Duration.ZERO : remainingTtl);
        RefreshResponse response = RefreshResponse.builder().accessToken(accessToken).tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessTokenTtl().toSeconds()).build();
        return new RefreshResult(response, cookie);
    }

    private static AppException error(String code, String message) {
        return new AppException(HttpStatus.UNAUTHORIZED, code, message);
    }
}
