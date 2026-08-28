package com.mailflow.auth.application;

import com.mailflow.auth.api.request.ForgotPasswordRequest;
import com.mailflow.auth.api.request.ResetPasswordRequest;
import com.mailflow.auth.application.event.PasswordResetRequestedEvent;
import com.mailflow.auth.domain.model.OneTimeToken;
import com.mailflow.auth.domain.model.OneTimeTokenPurpose;
import com.mailflow.auth.domain.repository.OneTimeTokenRepository;
import com.mailflow.auth.infrastructure.token.SecureTokenGenerator;
import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.model.UserStatus;
import com.mailflow.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    static final long RESET_TOKEN_TTL_HOURS = 1;

    private final UserRepository userRepository;
    private final OneTimeTokenRepository oneTimeTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureTokenGenerator tokenGenerator;
    private final ApplicationEventPublisher eventPublisher;
    private final SessionService sessionService;

    @Transactional
    public void requestReset(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null || user.getStatus() != UserStatus.ACTIVE) {
            return;
        }

        List<OneTimeToken> activeTokens = oneTimeTokenRepository
                .findByUserIdAndPurposeAndConsumedAtIsNull(user.getId(), OneTimeTokenPurpose.PASSWORD_RESET);
        activeTokens.forEach(OneTimeToken::markAsConsumed);
        oneTimeTokenRepository.saveAll(activeTokens);

        String rawToken = tokenGenerator.generateRawToken();
        oneTimeTokenRepository.save(new OneTimeToken(
                user.getId(),
                OneTimeTokenPurpose.PASSWORD_RESET,
                tokenGenerator.hashToken(rawToken),
                Instant.now().plus(RESET_TOKEN_TTL_HOURS, ChronoUnit.HOURS)
        ));
        eventPublisher.publishEvent(new PasswordResetRequestedEvent(
                user.getEmail(),
                user.getLastName() + " " + user.getFirstName(),
                rawToken
        ));
        log.info("Đã tạo mã đặt lại mật khẩu cho tài khoản [{}]", user.getEmail());
    }

    @Transactional
    public ResponseCookie resetPassword(ResetPasswordRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "PASSWORD_MISMATCH",
                    "Mật khẩu xác nhận không khớp với mật khẩu mới."
            );
        }

        OneTimeToken token = oneTimeTokenRepository.findByTokenHashAndPurposeForUpdate(
                        tokenGenerator.hashToken(request.getToken().trim()),
                        OneTimeTokenPurpose.PASSWORD_RESET)
                .orElseThrow(() -> new AppException(
                        HttpStatus.BAD_REQUEST,
                        "INVALID_TOKEN",
                        "Liên kết đặt lại mật khẩu không hợp lệ hoặc không tồn tại."
                ));
        if (token.isConsumed()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_TOKEN",
                    "Liên kết đặt lại mật khẩu đã được sử dụng."
            );
        }
        if (token.isExpired()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "TOKEN_EXPIRED",
                    "Liên kết đặt lại mật khẩu đã hết hạn."
            );
        }

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", token.getUserId().toString()));

        if (user.getStatus() != UserStatus.ACTIVE) {
            UserStatusPolicy.requireActive(user);
        }

        if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "NEW_PASSWORD_SAME_AS_OLD",
                    "Mật khẩu mới không được trùng với mật khẩu cũ."
            );
        }

        token.markAsConsumed();
        oneTimeTokenRepository.save(token);

        user.updatePassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        log.info("Đã đặt lại mật khẩu cho tài khoản [{}]", user.getEmail());
        return sessionService.revokeAllSessions(user.getId(), "PASSWORD_RESET");
    }
}
