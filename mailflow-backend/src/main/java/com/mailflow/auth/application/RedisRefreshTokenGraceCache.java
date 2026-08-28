package com.mailflow.auth.application;

import com.mailflow.auth.infrastructure.jwt.JwtProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@RequiredArgsConstructor
public class RedisRefreshTokenGraceCache implements RefreshTokenGraceCache {

    static final String KEY_PREFIX = "mailflow:rtr:grace:";
    private static final char VALUE_SEPARATOR = '|';

    private final StringRedisTemplate stringRedisTemplate;
    private final JwtProperties jwtProperties;

    @Override
    public void put(String oldTokenHash, String newRawToken, UUID sessionId) {
        stringRedisTemplate.opsForValue().set(
                key(oldTokenHash),
                sessionId + String.valueOf(VALUE_SEPARATOR) + newRawToken,
                jwtProperties.getRefreshGraceTtl()
        );
    }

    @Override
    public Optional<GraceEntry> getValid(String oldTokenHash, UUID sessionId) {
        String value = stringRedisTemplate.opsForValue().get(key(oldTokenHash));
        if (value == null) {
            return Optional.empty();
        }
        int separator = value.indexOf(VALUE_SEPARATOR);
        if (separator <= 0) {
            return Optional.empty();
        }
        UUID storedSessionId;
        try {
            storedSessionId = UUID.fromString(value.substring(0, separator));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
        if (!storedSessionId.equals(sessionId)) {
            return Optional.empty();
        }
        String newRawToken = value.substring(separator + 1);
        return Optional.of(new GraceEntry(
                newRawToken,
                storedSessionId,
                Instant.now().plus(jwtProperties.getRefreshGraceTtl())
        ));
    }

    static String key(String tokenHash) {
        return KEY_PREFIX + tokenHash;
    }
}
