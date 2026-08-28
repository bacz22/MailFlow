package com.mailflow.auth.application;

import com.mailflow.auth.api.request.VerifyEmailRequest;
import com.mailflow.auth.api.response.VerifyEmailResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final OneTimeTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final SecureTokenGenerator tokenGenerator;

    @Transactional(noRollbackFor = AppException.class)
    public VerifyEmailResponse verify(VerifyEmailRequest request) {
        OneTimeToken token = tokenRepository.findByTokenHashAndPurposeForUpdate(
                        tokenGenerator.hashToken(request.getToken().trim()), OneTimeTokenPurpose.EMAIL_VERIFICATION)
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN",
                        "Mã xác thực không hợp lệ hoặc không tồn tại."));
        if (token.isConsumed()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "Mã xác thực đã được sử dụng.");
        }
        if (token.isExpired()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "TOKEN_EXPIRED", "Liên kết xác thực đã hết hạn.");
        }

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", token.getUserId().toString()));
        token.markAsConsumed();
        tokenRepository.save(token);

        if (user.getStatus() == UserStatus.LOCKED || user.getStatus() == UserStatus.DISABLED) {
            UserStatusPolicy.requireActive(user);
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            user.verifyEmail(Instant.now());
            userRepository.save(user);
        }
        log.info("Xác thực email thành công cho [{}]", user.getEmail());
        return VerifyEmailResponse.builder().email(user.getEmail()).status(user.getStatus())
                .message("Tài khoản đã được kích hoạt thành công.").build();
    }
}
