package com.mailflow.auth.application;

import com.mailflow.auth.api.request.LoginRequest;
import com.mailflow.auth.api.response.LoginResponse;
import com.mailflow.auth.api.response.UserSummaryDto;
import com.mailflow.auth.application.result.LoginResult;
import com.mailflow.auth.domain.model.AuthSession;
import com.mailflow.auth.domain.model.RefreshToken;
import com.mailflow.auth.domain.repository.AuthSessionRepository;
import com.mailflow.auth.domain.repository.RefreshTokenRepository;
import com.mailflow.auth.infrastructure.cookie.AuthCookieService;
import com.mailflow.auth.infrastructure.jwt.AccessTokenService;
import com.mailflow.auth.infrastructure.jwt.JwtProperties;
import com.mailflow.auth.infrastructure.token.SecureTokenGenerator;
import com.mailflow.common.exception.AppException;
import com.mailflow.common.web.ClientIpResolver;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String DUMMY_BCRYPT_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoO9m51P4e488E8q3v50G5w47mYy4t5e8m";

    private final UserRepository userRepository;
    private final AuthSessionRepository sessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProperties jwtProperties;
    private final AccessTokenService accessTokenService;
    private final SecureTokenGenerator tokenGenerator;
    private final AuthCookieService cookieService;

    @Transactional
    public LoginResult login(LoginRequest request, HttpServletRequest httpRequest) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        Optional<User> candidate = userRepository.findByEmailIgnoreCase(email);
        String hash = candidate.map(User::getPassword).orElse(DUMMY_BCRYPT_HASH);
        if (!passwordEncoder.matches(request.getPassword(), hash) || candidate.isEmpty()) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
                    "Email hoặc mật khẩu không chính xác.");
        }
        User user = candidate.get();
        UserStatusPolicy.requireActive(user);

        String userAgent = httpRequest == null ? null : httpRequest.getHeader("User-Agent");
        Duration refreshTtl = Boolean.TRUE.equals(request.getRememberMe())
                ? jwtProperties.getRememberMeRefreshTokenTtl() : jwtProperties.getRefreshTokenTtl();
        Instant expiresAt = Instant.now().plus(refreshTtl);
        AuthSession session = sessionRepository.save(AuthSession.builder()
                .userId(user.getId()).device(device(userAgent)).browser(browser(userAgent))
                .operatingSystem(operatingSystem(userAgent)).ipAddress(clientIp(httpRequest))
                .userAgent(truncate(userAgent, 500)).expiresAt(expiresAt).build());

        String rawRefreshToken = tokenGenerator.generateRawToken();
        refreshTokenRepository.save(RefreshToken.builder().sessionId(session.getId())
                .tokenHash(tokenGenerator.hashToken(rawRefreshToken)).expiresAt(expiresAt).build());
        String accessToken = accessTokenService.issueAccessToken(user, session.getId());
        ResponseCookie cookie = cookieService.createRefreshCookie(rawRefreshToken, refreshTtl);
        LoginResponse response = LoginResponse.builder().accessToken(accessToken).tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessTokenTtl().toSeconds())
                .user(UserSummaryDto.builder().id(user.getId()).email(user.getEmail())
                        .firstName(user.getFirstName()).lastName(user.getLastName()).status(user.getStatus()).build())
                .build();
        log.info("Đăng nhập thành công cho [{}] trên session [{}]", user.getEmail(), session.getId());
        return new LoginResult(response, cookie);
    }

    private static String clientIp(HttpServletRequest request) {
        return ClientIpResolver.resolve(request);
    }

    private static String truncate(String value, int length) {
        return value != null && value.length() > length ? value.substring(0, length) : value;
    }

    private static String device(String ua) {
        if (ua == null) return "Unknown";
        if (ua.contains("Mobile") || ua.contains("Android") || ua.contains("iPhone")) return "Mobile Device";
        if (ua.contains("iPad") || ua.contains("Tablet")) return "Tablet";
        return "Desktop";
    }

    private static String browser(String ua) {
        if (ua == null) return "Unknown";
        if (ua.contains("Edg/")) return "Microsoft Edge";
        if (ua.contains("Chrome/")) return "Google Chrome";
        if (ua.contains("Safari/") && !ua.contains("Chrome/")) return "Apple Safari";
        if (ua.contains("Firefox/")) return "Mozilla Firefox";
        return "Browser";
    }

    private static String operatingSystem(String ua) {
        if (ua == null) return "Unknown";
        if (ua.contains("Windows NT 10.0")) return "Windows 10/11";
        if (ua.contains("Macintosh") || ua.contains("Mac OS X")) return "macOS";
        if (ua.contains("Android")) return "Android";
        if (ua.contains("iPhone") || ua.contains("iPad")) return "iOS";
        if (ua.contains("Linux")) return "Linux";
        return "Unknown OS";
    }
}
