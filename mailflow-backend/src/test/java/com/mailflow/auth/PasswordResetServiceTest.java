package com.mailflow.auth;

import com.mailflow.auth.api.request.ForgotPasswordRequest;
import com.mailflow.auth.api.request.ResetPasswordRequest;
import com.mailflow.auth.application.PasswordResetService;
import com.mailflow.auth.application.SessionService;
import com.mailflow.auth.application.event.PasswordResetRequestedEvent;
import com.mailflow.auth.domain.model.OneTimeToken;
import com.mailflow.auth.domain.model.OneTimeTokenPurpose;
import com.mailflow.auth.domain.repository.OneTimeTokenRepository;
import com.mailflow.auth.infrastructure.token.SecureTokenGenerator;
import com.mailflow.common.exception.AppException;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.model.UserStatus;
import com.mailflow.user.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock UserRepository userRepository;
    @Mock OneTimeTokenRepository oneTimeTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock SecureTokenGenerator tokenGenerator;
    @Mock ApplicationEventPublisher eventPublisher;
    @Mock SessionService sessionService;
    @InjectMocks PasswordResetService passwordResetService;

    @Test
    void requestReset_unknownEmail_silent() {
        when(userRepository.findByEmailIgnoreCase("missing@mailflow.dev")).thenReturn(Optional.empty());

        passwordResetService.requestReset(ForgotPasswordRequest.builder()
                .email("missing@mailflow.dev")
                .build());

        verify(oneTimeTokenRepository, never()).save(any());
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void requestReset_pendingUser_silent() {
        User user = userWithStatus(UserStatus.PENDING);
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));

        passwordResetService.requestReset(ForgotPasswordRequest.builder()
                .email(user.getEmail())
                .build());

        verify(oneTimeTokenRepository, never()).save(any());
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void requestReset_activeUser_issuesTokenAndPublishesEvent() {
        User user = userWithStatus(UserStatus.ACTIVE);
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(oneTimeTokenRepository.findByUserIdAndPurposeAndConsumedAtIsNull(
                user.getId(), OneTimeTokenPurpose.PASSWORD_RESET)).thenReturn(List.of());
        when(tokenGenerator.generateRawToken()).thenReturn("raw-reset");
        when(tokenGenerator.hashToken("raw-reset")).thenReturn("hash-reset");

        passwordResetService.requestReset(ForgotPasswordRequest.builder()
                .email("  " + user.getEmail().toUpperCase() + "  ")
                .build());

        ArgumentCaptor<OneTimeToken> tokenCaptor = ArgumentCaptor.forClass(OneTimeToken.class);
        verify(oneTimeTokenRepository).save(tokenCaptor.capture());
        OneTimeToken saved = tokenCaptor.getValue();
        assertThat(saved.getUserId()).isEqualTo(user.getId());
        assertThat(saved.getPurpose()).isEqualTo(OneTimeTokenPurpose.PASSWORD_RESET);
        assertThat(saved.getTokenHash()).isEqualTo("hash-reset");
        assertThat(saved.getExpiresAt()).isAfter(Instant.now().plus(50, ChronoUnit.MINUTES));

        ArgumentCaptor<PasswordResetRequestedEvent> eventCaptor =
                ArgumentCaptor.forClass(PasswordResetRequestedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().getEmail()).isEqualTo(user.getEmail());
        assertThat(eventCaptor.getValue().getRawToken()).isEqualTo("raw-reset");
    }

    @Test
    void requestReset_consumesPreviousUnusedTokens() {
        User user = userWithStatus(UserStatus.ACTIVE);
        OneTimeToken previous = new OneTimeToken(
                user.getId(),
                OneTimeTokenPurpose.PASSWORD_RESET,
                "old-hash",
                Instant.now().plus(1, ChronoUnit.HOURS)
        );
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(oneTimeTokenRepository.findByUserIdAndPurposeAndConsumedAtIsNull(
                user.getId(), OneTimeTokenPurpose.PASSWORD_RESET)).thenReturn(List.of(previous));
        when(tokenGenerator.generateRawToken()).thenReturn("raw-reset");
        when(tokenGenerator.hashToken("raw-reset")).thenReturn("hash-reset");

        passwordResetService.requestReset(ForgotPasswordRequest.builder().email(user.getEmail()).build());

        assertThat(previous.isConsumed()).isTrue();
        verify(oneTimeTokenRepository).saveAll(List.of(previous));
    }

    @Test
    void resetPassword_success_updatesPasswordAndRevokesSessions() {
        User user = userWithStatus(UserStatus.ACTIVE);
        OneTimeToken token = validResetToken(user.getId());
        when(tokenGenerator.hashToken("raw-reset")).thenReturn("hash-reset");
        when(oneTimeTokenRepository.findByTokenHashAndPurposeForUpdate(
                "hash-reset", OneTimeTokenPurpose.PASSWORD_RESET)).thenReturn(Optional.of(token));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("NewPass123!", user.getPassword())).thenReturn(false);
        when(passwordEncoder.encode("NewPass123!")).thenReturn("new-hash");
        ResponseCookie cookie = ResponseCookie.from("mf_refresh", "").maxAge(0).build();
        when(sessionService.revokeAllSessions(user.getId(), "PASSWORD_RESET")).thenReturn(cookie);

        ResponseCookie result = passwordResetService.resetPassword(resetRequest("raw-reset", "NewPass123!"));

        assertThat(result).isSameAs(cookie);
        assertThat(token.isConsumed()).isTrue();
        assertThat(user.getPassword()).isEqualTo("new-hash");
        verify(userRepository).save(user);
        verify(sessionService).revokeAllSessions(user.getId(), "PASSWORD_RESET");
    }

    @Test
    void resetPassword_invalidToken_rejected() {
        when(tokenGenerator.hashToken("bad")).thenReturn("bad-hash");
        when(oneTimeTokenRepository.findByTokenHashAndPurposeForUpdate(
                "bad-hash", OneTimeTokenPurpose.PASSWORD_RESET)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.resetPassword(resetRequest("bad", "NewPass123!")))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("code", "INVALID_TOKEN");
        verify(sessionService, never()).revokeAllSessions(any(), any());
    }

    @Test
    void resetPassword_consumedToken_rejected() {
        User user = userWithStatus(UserStatus.ACTIVE);
        OneTimeToken token = validResetToken(user.getId());
        token.markAsConsumed();
        when(tokenGenerator.hashToken("raw-reset")).thenReturn("hash-reset");
        when(oneTimeTokenRepository.findByTokenHashAndPurposeForUpdate(
                "hash-reset", OneTimeTokenPurpose.PASSWORD_RESET)).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.resetPassword(resetRequest("raw-reset", "NewPass123!")))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("code", "INVALID_TOKEN");
    }

    @Test
    void resetPassword_expiredToken_rejected() {
        User user = userWithStatus(UserStatus.ACTIVE);
        OneTimeToken token = new OneTimeToken(
                user.getId(),
                OneTimeTokenPurpose.PASSWORD_RESET,
                "hash-reset",
                Instant.now().minus(1, ChronoUnit.MINUTES)
        );
        when(tokenGenerator.hashToken("raw-reset")).thenReturn("hash-reset");
        when(oneTimeTokenRepository.findByTokenHashAndPurposeForUpdate(
                "hash-reset", OneTimeTokenPurpose.PASSWORD_RESET)).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.resetPassword(resetRequest("raw-reset", "NewPass123!")))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("code", "TOKEN_EXPIRED");
        assertThat(token.isConsumed()).isFalse();
    }

    @Test
    void resetPassword_sameAsOld_rejectedWithoutConsuming() {
        User user = userWithStatus(UserStatus.ACTIVE);
        OneTimeToken token = validResetToken(user.getId());
        when(tokenGenerator.hashToken("raw-reset")).thenReturn("hash-reset");
        when(oneTimeTokenRepository.findByTokenHashAndPurposeForUpdate(
                "hash-reset", OneTimeTokenPurpose.PASSWORD_RESET)).thenReturn(Optional.of(token));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPass123!", user.getPassword())).thenReturn(true);

        assertThatThrownBy(() -> passwordResetService.resetPassword(resetRequest("raw-reset", "OldPass123!")))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("code", "NEW_PASSWORD_SAME_AS_OLD");
        assertThat(token.isConsumed()).isFalse();
        verify(sessionService, never()).revokeAllSessions(any(), eq("PASSWORD_RESET"));
    }

    @Test
    void resetPassword_mismatch_rejected() {
        assertThatThrownBy(() -> passwordResetService.resetPassword(
                ResetPasswordRequest.builder()
                        .token("raw-reset")
                        .password("NewPass123!")
                        .confirmPassword("OtherPass123!")
                        .build()
        ))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("code", "PASSWORD_MISMATCH");
        verifyNoInteractions(oneTimeTokenRepository);
    }

    private static ResetPasswordRequest resetRequest(String token, String password) {
        return ResetPasswordRequest.builder()
                .token(token)
                .password(password)
                .confirmPassword(password)
                .build();
    }

    private static OneTimeToken validResetToken(UUID userId) {
        return new OneTimeToken(
                userId,
                OneTimeTokenPurpose.PASSWORD_RESET,
                "hash-reset",
                Instant.now().plus(1, ChronoUnit.HOURS)
        );
    }

    private static User userWithStatus(UserStatus status) {
        User user = new User("active@mailflow.dev", "password-hash", "Van", "Nguyen");
        user.setId(UUID.randomUUID());
        user.setStatus(status);
        return user;
    }
}
