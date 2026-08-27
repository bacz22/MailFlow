package com.mailflow.auth;

import com.mailflow.auth.dto.AuthRefreshResult;
import com.mailflow.auth.service.RefreshTokenGenerator;
import com.mailflow.auth.service.impl.AuthService;
import com.mailflow.common.exception.AppException;
import com.mailflow.entity.AuthSession;
import com.mailflow.entity.RefreshToken;
import com.mailflow.entity.User;
import com.mailflow.entity.UserStatus;
import com.mailflow.repository.AuthSessionRepository;
import com.mailflow.repository.RefreshTokenRepository;
import com.mailflow.repository.UserRepository;
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
import java.util.concurrent.Future;
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
    private RefreshTokenGenerator refreshTokenGenerator;

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("Kiểm thử đồng thời (Concurrency Test): Hai request refresh cùng lúc chỉ 1 request thành công, request còn lại bị Reuse Detection và Session bị revoke vĩnh viễn")
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
                    AuthRefreshResult result = authService.refresh(tokenToRefresh, null);
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
                .as("Chính xác 1 request refresh phải thành công")
                .isEqualTo(1);

        assertThat(reuseDetectedCount.get())
                .as("Request thứ hai đến sau phải bị chặn bởi REFRESH_TOKEN_REUSE_DETECTED")
                .isEqualTo(1);

        // 4. Khẳng định: Session bị thu hồi trong database do phát hiện hành vi reuse
        AuthSession reloadedSession = authSessionRepository.findById(sessionId).orElseThrow();
        assertThat(reloadedSession.isRevoked()).isTrue();
        assertThat(reloadedSession.getRevokeReason()).isEqualTo("REUSE_DETECTED");
    }
}
