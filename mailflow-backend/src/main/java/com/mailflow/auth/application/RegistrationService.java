package com.mailflow.auth.application;

import com.mailflow.auth.api.request.RegisterRequest;
import com.mailflow.auth.api.request.ResendVerificationRequest;
import com.mailflow.auth.api.response.RegisterResponse;
import com.mailflow.auth.application.event.UserRegisteredEvent;
import com.mailflow.auth.domain.model.OneTimeToken;
import com.mailflow.auth.domain.model.OneTimeTokenPurpose;
import com.mailflow.auth.domain.repository.OneTimeTokenRepository;
import com.mailflow.auth.infrastructure.token.SecureTokenGenerator;
import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.EmailAlreadyExistsException;
import com.mailflow.user.domain.model.Role;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.model.UserStatus;
import com.mailflow.user.domain.repository.RoleRepository;
import com.mailflow.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegistrationService {

    private static final String DEFAULT_ROLE_NAME = "ROLE_OWNER";
    private static final long VERIFICATION_TOKEN_TTL_HOURS = 24;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OneTimeTokenRepository oneTimeTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureTokenGenerator tokenGenerator;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "PASSWORD_MISMATCH",
                    "Mật khẩu xác nhận không khớp");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        Role role = roleRepository.findByNameIgnoreCase(DEFAULT_ROLE_NAME)
                .orElseThrow(() -> new IllegalStateException("ROLE_OWNER chưa được seed trong database."));
        User user = new User(email, passwordEncoder.encode(request.getPassword()),
                request.getFirstName().trim(), request.getLastName().trim());
        user.setStatus(UserStatus.PENDING);
        user.addRole(role);

        User savedUser;
        try {
            savedUser = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            if (isEmailUniqueViolation(ex)) {
                throw new EmailAlreadyExistsException(email);
            }
            throw ex;
        }

        publishVerificationToken(savedUser);
        Set<String> roles = savedUser.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        return RegisterResponse.builder()
                .id(savedUser.getId()).email(savedUser.getEmail())
                .firstName(savedUser.getFirstName()).lastName(savedUser.getLastName())
                .status(savedUser.getStatus()).roles(roles)
                .message("Đăng ký tài khoản thành công. Mã xác thực đã được gửi tới email của bạn.")
                .createdAt(savedUser.getCreatedAt()).build();
    }

    @Transactional
    public void resendVerification(ResendVerificationRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null || user.isEmailVerified() || user.getStatus() == UserStatus.ACTIVE) {
            return;
        }
        List<OneTimeToken> activeTokens = oneTimeTokenRepository
                .findByUserIdAndPurposeAndConsumedAtIsNull(user.getId(), OneTimeTokenPurpose.EMAIL_VERIFICATION);
        activeTokens.forEach(OneTimeToken::markAsConsumed);
        oneTimeTokenRepository.saveAll(activeTokens);
        publishVerificationToken(user);
    }

    private void publishVerificationToken(User user) {
        String rawToken = tokenGenerator.generateRawToken();
        oneTimeTokenRepository.save(new OneTimeToken(user.getId(), OneTimeTokenPurpose.EMAIL_VERIFICATION,
                tokenGenerator.hashToken(rawToken), Instant.now().plus(VERIFICATION_TOKEN_TTL_HOURS, ChronoUnit.HOURS)));
        eventPublisher.publishEvent(new UserRegisteredEvent(user.getEmail(),
                user.getLastName() + " " + user.getFirstName(), rawToken));
        log.info("Đã tạo mã xác thực cho tài khoản [{}]", user.getEmail());
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static boolean isEmailUniqueViolation(DataIntegrityViolationException ex) {
        Throwable current = ex;
        while (current != null) {
            if (current.getMessage() != null
                    && current.getMessage().toLowerCase(Locale.ROOT).contains("uk_users_email")) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
