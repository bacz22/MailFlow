package com.mailflow.auth;

import com.mailflow.auth.application.RedisRefreshTokenGraceCache;
import com.mailflow.auth.application.RefreshTokenGraceCache.GraceEntry;
import com.mailflow.auth.infrastructure.jwt.JwtProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RedisRefreshTokenGraceCacheTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private RedisRefreshTokenGraceCache cache;

    @BeforeEach
    void setUp() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setRefreshGraceTtl(Duration.ofSeconds(10));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        cache = new RedisRefreshTokenGraceCache(stringRedisTemplate, jwtProperties);
    }

    @Test
    @DisplayName("put ghi Redis với TTL 10s, key mailflow:rtr:grace:{hash}")
    void put_setsValueWithTtl() {
        UUID sessionId = UUID.randomUUID();

        cache.put("old_hash", "raw_new_token", sessionId);

        verify(valueOperations).set(
                "mailflow:rtr:grace:old_hash",
                sessionId + "|raw_new_token",
                Duration.ofSeconds(10)
        );
    }

    @Test
    @DisplayName("getValid hit đúng session -> trả token mới")
    void getValid_hitMatchingSession() {
        UUID sessionId = UUID.randomUUID();
        when(valueOperations.get("mailflow:rtr:grace:old_hash"))
                .thenReturn(sessionId + "|raw_cached_token");

        Optional<GraceEntry> entry = cache.getValid("old_hash", sessionId);

        assertThat(entry).isPresent();
        assertThat(entry.get().newRawToken()).isEqualTo("raw_cached_token");
        assertThat(entry.get().sessionId()).isEqualTo(sessionId);
    }

    @Test
    @DisplayName("getValid miss hoặc sai session -> empty")
    void getValid_missOrWrongSession() {
        UUID sessionId = UUID.randomUUID();
        when(valueOperations.get("mailflow:rtr:grace:missing")).thenReturn(null);
        when(valueOperations.get("mailflow:rtr:grace:old_hash"))
                .thenReturn(UUID.randomUUID() + "|raw_cached_token");

        assertThat(cache.getValid("missing", sessionId)).isEmpty();
        assertThat(cache.getValid("old_hash", sessionId)).isEmpty();
    }
}
