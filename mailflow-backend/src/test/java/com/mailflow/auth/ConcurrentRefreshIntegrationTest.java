package com.mailflow.auth;

import com.mailflow.auth.application.result.RefreshResult;
import com.mailflow.auth.infrastructure.token.SecureTokenGenerator;
import com.mailflow.auth.application.RefreshTokenService;
import com.mailflow.common.exception.AppException;
import com.mailflow.auth.domain.model.AuthSession;
import com.mailflow.auth.domain.model.RefreshToken;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.model.UserStatus;
import com.mailflow.auth.domain.repository.AuthSessionRepository;
import com.mailflow.auth.domain.repository.RefreshTokenRepository;
import com.mailflow.user.domain.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ConcurrentRefreshIntegrationTest {

    @Autowired
    private AuthSessionRepository authSessionRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SecureTokenGenerator refreshTokenGenerator;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Test
    @DisplayName("Hai request refresh đồng thời trong grace window đều thành công và session không bị revoke")
    void concurrentRefresh_onlyOneSucceeds_andReuseDetected() throws Exception {
        // 1. Tạo user & session & refresh token hợp lệ trong database
        String email = "concurrent." + UUID.randomUUID() + "@mailflow.dev";
        User user = new User(email, "hashed_password", "Concurrent", "Tester");
        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.save(user);

        AuthSession session = AuthSession.builder()
                .userId(user.getId())
                .device("Desktop")
                .browser("Chrome")
                .operatingSystem("Windows 11")
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();
        session = authSessionRepository.save(session);

        String rawToken = "raw_concurrent_token_" + UUID.randomUUID();
        String tokenHash = refreshTokenGenerator.hashToken(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .sessionId(session.getId())
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();
        refreshTokenRepository.save(refreshToken);

        final UUID sessionId = session.getId();
        final String tokenToRefresh = rawToken;

        // 2. Sử dụng CountDownLatch để kích hoạt 2 luồng refresh chính xác cùng 1 thời điểm
        int numberOfThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger reuseDetectedCount = new AtomicInteger(0);
        List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < numberOfThreads; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await(); // Chờ hiệu lệnh xuất phát đồng thời
                    RefreshResult result = refreshTokenService.refresh(tokenToRefresh);
                    if (result != null && result.getResponse() != null) {
                        successCount.incrementAndGet();
                    }
                } catch (AppException e) {
                    if ("REFRESH_TOKEN_REUSE_DETECTED".equals(e.getCode())) {
                        reuseDetectedCount.incrementAndGet();
                    } else {
                        errors.add(e);
                    }
                } catch (Throwable t) {
                    errors.add(t);
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        // Bắn súng xuất phát đồng thời 2 luồng
        startLatch.countDown();
        boolean finishedInTime = finishLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(finishedInTime).isTrue();
        assertThat(errors).isEmpty();

        // 3. Khẳng định: Chính xác 1 request thành công và 1 request bị phát hiện reuse
        assertThat(successCount.get())
                .as("Cả hai request refresh trong grace window phải thành công")
                .isEqualTo(2);

        assertThat(reuseDetectedCount.get())
                .as("Không được coi refresh đồng thời trong grace là reuse")
                .isZero();

        // Session vẫn còn hiệu lực — không bị thu hồi vì race hai tab
        AuthSession reloadedSession = authSessionRepository.findById(sessionId).orElseThrow();
        assertThat(reloadedSession.isRevoked()).isFalse();
    }
}
