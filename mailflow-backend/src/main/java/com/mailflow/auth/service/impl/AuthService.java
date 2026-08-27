package com.mailflow.auth.service.impl;

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
import com.mailflow.auth.event.UserRegisteredEvent;
import com.mailflow.auth.service.AccessTokenService;
import com.mailflow.auth.service.AuthCookieService;
import com.mailflow.auth.service.AuthSessionRevocationService;
import com.mailflow.auth.service.IAuthService;
import com.mailflow.auth.service.RefreshTokenGenerator;
import com.mailflow.auth.service.RefreshTokenRotationService;
import com.mailflow.auth.service.RefreshTokenRotationService.RotationResult;
import com.mailflow.auth.service.RefreshTokenRotationService.RotationStatus;
import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.EmailAlreadyExistsException;
import com.mailflow.common.exception.ResourceNotFoundException;
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
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService implements IAuthService {

    private static final String DEFAULT_ROLE_NAME = "ROLE_OWNER";
    private static final long VERIFICATION_TOKEN_TTL_HOURS = 24;
    // Dummy BCrypt hash để thực hiện so khớp thời gian thực khi email không tồn tại (chống timing attacks)
    private static final String DUMMY_BCRYPT_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoO9m51P4e488E8q3v50G5w47mYy4t5e8m";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OneTimeTokenRepository oneTimeTokenRepository;
    private final AuthSessionRepository authSessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenRotationService refreshTokenRotationService;
    private final AuthSessionRevocationService authSessionRevocationService;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final JwtProperties jwtProperties;
    private final AccessTokenService accessTokenService;
    private final RefreshTokenGenerator refreshTokenGenerator;
    private final AuthCookieService authCookieService;

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "PASSWORD_MISMATCH", "Mật khẩu xác nhận không khớp");
        }

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new EmailAlreadyExistsException(normalizedEmail);
        }

        Role userRole = roleRepository.findByNameIgnoreCase(DEFAULT_ROLE_NAME)
                .orElseGet(() -> roleRepository.save(new Role(DEFAULT_ROLE_NAME, "Standard user role")));

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User(
                normalizedEmail,
                encodedPassword,
                request.getFirstName().trim(),
                request.getLastName().trim()
        );
        user.setStatus(UserStatus.PENDING);
        user.addRole(userRole);

        User savedUser = userRepository.save(user);

        // Tạo one-time token cho xác thực email
        String rawToken = refreshTokenGenerator.generateRawToken();
        String tokenHash = refreshTokenGenerator.hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(VERIFICATION_TOKEN_TTL_HOURS, ChronoUnit.HOURS);

        OneTimeToken verificationToken = new OneTimeToken(
                savedUser.getId(),
                OneTimeTokenPurpose.EMAIL_VERIFICATION,
                tokenHash,
                expiresAt
        );
        oneTimeTokenRepository.save(verificationToken);

        log.info("Đăng ký tài khoản thành công cho [{}]", savedUser.getEmail());

        // Phát sự kiện gửi email xác thực bất đồng bộ sau khi commit DB
        eventPublisher.publishEvent(new UserRegisteredEvent(
                savedUser.getEmail(),
                savedUser.getLastName() + " " + savedUser.getFirstName(),
                rawToken
        ));

        Set<String> roleNames = savedUser.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return RegisterResponse.builder()
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .status(savedUser.getStatus())
                .roles(roleNames)
                .message("Đăng ký tài khoản thành công. Mã xác thực đã được gửi tới email của bạn.")
                .createdAt(savedUser.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public VerifyEmailResponse verifyEmail(VerifyEmailRequest request) {
        String tokenHash = refreshTokenGenerator.hashToken(request.getToken().trim());

        OneTimeToken token = oneTimeTokenRepository.findByTokenHashAndPurpose(
                tokenHash,
                OneTimeTokenPurpose.EMAIL_VERIFICATION
        ).orElseThrow(() -> new AppException(
                HttpStatus.BAD_REQUEST,
                "INVALID_TOKEN",
                "Mã xác thực không hợp lệ hoặc không tồn tại."
        ));

        if (token.isConsumed()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_TOKEN",
                    "Mã xác thực này đã được sử dụng trước đây."
            );
        }

        if (token.isExpired()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "TOKEN_EXPIRED",
                    "Liên kết xác thực đã hết hạn (chỉ có hiệu lực trong 24 giờ)."
            );
        }

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", token.getUserId().toString()));

        token.markAsConsumed();
        oneTimeTokenRepository.save(token);

        user.verifyEmail(Instant.now());
        userRepository.save(user);

        log.info("Xác thực email thành công cho tài khoản: [{}]", user.getEmail());

        return VerifyEmailResponse.builder()
                .email(user.getEmail())
                .status(user.getStatus())
                .message("Tài khoản của bạn đã được kích hoạt thành công!")
                .build();
    }

    @Override
    @Transactional
    public void resendVerification(ResendVerificationRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (userOpt.isEmpty()) {
            log.info("Yêu cầu gửi lại xác thực cho email không tồn tại [{}], bỏ qua để bảo mật.", normalizedEmail);
            return;
        }

        User user = userOpt.get();
        if (user.isEmailVerified() || user.getStatus() == UserStatus.ACTIVE) {
            log.info("Tài khoản [{}] đã được kích hoạt từ trước.", normalizedEmail);
            return;
        }

        // Vô hiệu hóa các token cũ chưa sử dụng
        List<OneTimeToken> activeTokens = oneTimeTokenRepository.findByUserIdAndPurposeAndConsumedAtIsNull(
                user.getId(),
                OneTimeTokenPurpose.EMAIL_VERIFICATION
        );
        for (OneTimeToken oldToken : activeTokens) {
            oldToken.markAsConsumed();
        }
        oneTimeTokenRepository.saveAll(activeTokens);

        // Sinh mã mới
        String rawToken = refreshTokenGenerator.generateRawToken();
        String tokenHash = refreshTokenGenerator.hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(VERIFICATION_TOKEN_TTL_HOURS, ChronoUnit.HOURS);

        OneTimeToken newToken = new OneTimeToken(
                user.getId(),
                OneTimeTokenPurpose.EMAIL_VERIFICATION,
                tokenHash,
                expiresAt
        );
        oneTimeTokenRepository.save(newToken);

        log.info("Đã tạo mã xác thực mới cho tài khoản [{}]", user.getEmail());

        // Phát sự kiện gửi lại email xác thực bất đồng bộ
        eventPublisher.publishEvent(new UserRegisteredEvent(
                user.getEmail(),
                user.getLastName() + " " + user.getFirstName(),
                rawToken
        ));
    }

    @Override
    @Transactional
    public AuthResult login(LoginRequest request, HttpServletRequest httpRequest) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

        // 1. Tìm user và thực hiện so khớp BCrypt với dummy hash nếu user không tồn tại để chống timing attacks
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
        String hashToCheck = userOpt.map(User::getPassword).orElse(DUMMY_BCRYPT_HASH);
        boolean passwordMatches = passwordEncoder.matches(request.getPassword(), hashToCheck);

        if (userOpt.isEmpty() || !passwordMatches) {
            throw new AppException(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_CREDENTIALS",
                    "Email hoặc mật khẩu không chính xác."
            );
        }

        User user = userOpt.get();

        // 2. Kiểm tra trạng thái tài khoản
        validateUserStatus(user);

        // 3. Bóc tách thông tin thiết bị từ HTTP Request
        String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : null;
        String ipAddress = getClientIp(httpRequest);
        String device = parseDevice(userAgent);
        String browser = parseBrowser(userAgent);
        String os = parseOperatingSystem(userAgent);

        // 4. Xác định thời hạn Refresh Token (7 ngày hoặc 30 ngày nếu Remember Me)
        Duration refreshTtl = Boolean.TRUE.equals(request.getRememberMe())
                ? jwtProperties.getRememberMeRefreshTokenTtl()
                : jwtProperties.getRefreshTokenTtl();
        Instant expiresAt = Instant.now().plus(refreshTtl);

        // 5. Tạo AuthSession
        AuthSession session = AuthSession.builder()
                .userId(user.getId())
                .device(device)
                .browser(browser)
                .operatingSystem(os)
                .ipAddress(ipAddress)
                .userAgent(userAgent != null && userAgent.length() > 500 ? userAgent.substring(0, 500) : userAgent)
                .expiresAt(expiresAt)
                .build();
        AuthSession savedSession = authSessionRepository.save(session);

        // 6. Sinh Refresh Token ngẫu nhiên và lưu hash vào refresh_tokens
        String rawRefreshToken = refreshTokenGenerator.generateRawToken();
        String tokenHash = refreshTokenGenerator.hashToken(rawRefreshToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .sessionId(savedSession.getId())
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .build();
        refreshTokenRepository.save(refreshToken);

        // 7. Phát hành Access Token RS256 JWT
        String accessToken = accessTokenService.issueAccessToken(user, savedSession.getId());

        // 8. Tạo HttpOnly Cookie
        ResponseCookie cookie = authCookieService.createRefreshCookie(rawRefreshToken, refreshTtl);

        LoginResponse response = LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessTokenTtl().toSeconds())
                .user(UserSummaryDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .status(user.getStatus())
                        .build())
                .build();

        log.info("Đăng nhập thành công cho người dùng: [{}] trên phiên [{}]", user.getEmail(), savedSession.getId());

        return new AuthResult(response, cookie);
    }

    @Override
    public AuthRefreshResult refresh(String rawRefreshToken, HttpServletRequest httpRequest) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new AppException(
                    HttpStatus.UNAUTHORIZED,
                    "REFRESH_TOKEN_MISSING",
                    "Không tìm thấy refresh token trong yêu cầu."
            );
        }

        String tokenHash = refreshTokenGenerator.hashToken(rawRefreshToken);
        String newRawToken = refreshTokenGenerator.generateRawToken();
        String newTokenHash = refreshTokenGenerator.hashToken(newRawToken);

        // Thực hiện khóa và xoay vòng trong transaction độc lập để giải phóng lock trước khi xử lý revoke
        RotationResult result = refreshTokenRotationService.executeRotation(tokenHash, newRawToken, newTokenHash);

        if (result.getStatus() == RotationStatus.REUSE_DETECTED) {
            // Lock đã được giải phóng hoàn toàn, an toàn gọi revokeCompromisedSession
            authSessionRevocationService.revokeCompromisedSession(result.getSessionId(), "REUSE_DETECTED");

            throw new AppException(
                    HttpStatus.UNAUTHORIZED,
                    "REFRESH_TOKEN_REUSE_DETECTED",
                    "Phát hiện Refresh token đã từng được sử dụng. Toàn bộ phiên đăng nhập đã bị thu hồi vì lý do bảo mật."
            );
        }

        if (result.getStatus() == RotationStatus.INVALID) {
            throw new AppException(
                    HttpStatus.UNAUTHORIZED,
                    "REFRESH_TOKEN_INVALID",
                    "Refresh token không hợp lệ hoặc không tồn tại."
            );
        }

        if (result.getStatus() == RotationStatus.SESSION_REVOKED) {
            throw new AppException(
                    HttpStatus.UNAUTHORIZED,
                    "SESSION_REVOKED",
                    "Phiên đăng nhập đã bị thu hồi hoặc đã hết thời gian hiệu lực."
            );
        }

        if (result.getStatus() == RotationStatus.TOKEN_EXPIRED) {
            throw new AppException(
                    HttpStatus.UNAUTHORIZED,
                    "REFRESH_TOKEN_EXPIRED",
                    "Refresh token đã hết hạn."
            );
        }

        if (result.getStatus() == RotationStatus.USER_INVALID) {
            if (result.getUser() == null) {
                throw new AppException(
                        HttpStatus.UNAUTHORIZED,
                        "INVALID_CREDENTIALS",
                        "Người dùng không tồn tại."
                );
            }
            validateUserStatus(result.getUser());
        }

        // Phát hành Access Token mới
        String newAccessToken = accessTokenService.issueAccessToken(result.getUser(), result.getSession().getId());

        Duration remainingTtl = Duration.between(Instant.now(), result.getSession().getExpiresAt());
        if (remainingTtl.isNegative()) {
            remainingTtl = Duration.ZERO;
        }
        ResponseCookie newCookie = authCookieService.createRefreshCookie(newRawToken, remainingTtl);

        RefreshResponse response = RefreshResponse.builder()
                .accessToken(newAccessToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessTokenTtl().toSeconds())
                .build();

        return new AuthRefreshResult(response, newCookie);
    }

    @Override
    @Transactional
    public ResponseCookie logout(String sidStr) {
        if (sidStr != null && !sidStr.isBlank()) {
            try {
                UUID sessionId = UUID.fromString(sidStr);
                authSessionRepository.findById(sessionId).ifPresent(session -> {
                    session.revoke("USER_LOGOUT");
                    authSessionRepository.save(session);
                });
                List<RefreshToken> tokens = refreshTokenRepository.findAllBySessionId(sessionId);
                tokens.forEach(t -> t.revoke("USER_LOGOUT"));
                refreshTokenRepository.saveAll(tokens);
                log.info("Đã đăng xuất và thu hồi session: [{}]", sessionId);
            } catch (IllegalArgumentException ignored) {
            }
        }
        return authCookieService.createCleanRefreshCookie();
    }

    @Override
    @Transactional
    public ResponseCookie logoutAll(UUID userId) {
        List<AuthSession> sessions = authSessionRepository.findAllByUserId(userId);
        for (AuthSession session : sessions) {
            session.revoke("USER_LOGOUT_ALL");
            List<RefreshToken> tokens = refreshTokenRepository.findAllBySessionId(session.getId());
            tokens.forEach(t -> t.revoke("USER_LOGOUT_ALL"));
            refreshTokenRepository.saveAll(tokens);
        }
        authSessionRepository.saveAll(sessions);
        log.info("Đã thu hồi tất cả [{}] phiên đăng nhập của người dùng [{}]", sessions.size(), userId);
        return authCookieService.createCleanRefreshCookie();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SessionResponse> getSessions(UUID userId, UUID currentSessionId) {
        List<AuthSession> activeSessions = authSessionRepository
                .findAllByUserIdAndRevokedAtIsNullOrderByLastActiveAtDesc(userId);

        return activeSessions.stream()
                .filter(s -> !s.isExpired())
                .map(s -> SessionResponse.builder()
                        .id(s.getId())
                        .device(s.getDevice())
                        .browser(s.getBrowser())
                        .operatingSystem(s.getOperatingSystem())
                        .ipAddress(s.getIpAddress())
                        .lastActiveAt(s.getLastActiveAt())
                        .createdAt(s.getCreatedAt())
                        .isCurrent(currentSessionId != null && currentSessionId.equals(s.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void revokeSession(UUID sessionId, UUID userId) {
        AuthSession session = authSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên đăng nhập", sessionId.toString()));

        session.revoke("USER_REVOKED");
        authSessionRepository.save(session);

        List<RefreshToken> tokens = refreshTokenRepository.findAllBySessionId(sessionId);
        tokens.forEach(t -> t.revoke("USER_REVOKED"));
        refreshTokenRepository.saveAll(tokens);
    }

    private void validateUserStatus(User user) {
        if (user.getStatus() == UserStatus.PENDING) {
            throw new AppException(
                    HttpStatus.FORBIDDEN,
                    "EMAIL_NOT_VERIFIED",
                    "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác thực tài khoản."
            );
        }
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AppException(
                    HttpStatus.FORBIDDEN,
                    "ACCOUNT_LOCKED",
                    "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."
            );
        }
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new AppException(
                    HttpStatus.FORBIDDEN,
                    "ACCOUNT_DISABLED",
                    "Tài khoản này đã bị vô hiệu hóa."
            );
        }
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String remoteAddr = request.getRemoteAddr();
        return (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr : "127.0.0.1";
    }

    private String parseDevice(String userAgent) {
        if (userAgent == null) return "Unknown";
        if (userAgent.contains("Mobile") || userAgent.contains("Android") || userAgent.contains("iPhone")) {
            return "Mobile Device";
        }
        if (userAgent.contains("iPad") || userAgent.contains("Tablet")) {
            return "Tablet";
        }
        return "Desktop";
    }

    private String parseBrowser(String userAgent) {
        if (userAgent == null) return "Unknown";
        if (userAgent.contains("Edg/")) return "Microsoft Edge";
        if (userAgent.contains("Chrome/")) return "Google Chrome";
        if (userAgent.contains("Safari/") && !userAgent.contains("Chrome/")) return "Apple Safari";
        if (userAgent.contains("Firefox/")) return "Mozilla Firefox";
        return "Browser";
    }

    private String parseOperatingSystem(String userAgent) {
        if (userAgent == null) return "Unknown";
        if (userAgent.contains("Windows NT 10.0")) return "Windows 10/11";
        if (userAgent.contains("Macintosh") || userAgent.contains("Mac OS X")) return "macOS";
        if (userAgent.contains("Android")) return "Android";
        if (userAgent.contains("iPhone") || userAgent.contains("iPad")) return "iOS";
        if (userAgent.contains("Linux")) return "Linux";
        return "Unknown OS";
    }
}
