package com.mailflow.auth.application;

import com.mailflow.auth.infrastructure.jwt.JwtProperties;
import lombok.RequiredArgsConstructor;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RequiredArgsConstructor
public class InMemoryRefreshTokenGraceCache implements RefreshTokenGraceCache {

    private final JwtProperties jwtProperties;
    private final ConcurrentHashMap<String, GraceEntry> cache = new ConcurrentHashMap<>();

    @Override
    public void put(String oldTokenHash, String newRawToken, UUID sessionId) {
        cache.put(oldTokenHash, new GraceEntry(newRawToken, sessionId, Instant.now().plus(jwtProperties.getRefreshGraceTtl())));
    }

    @Override
    public Optional<GraceEntry> getValid(String oldTokenHash, UUID sessionId) {
        GraceEntry entry = cache.get(oldTokenHash);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.expiresAt().isBefore(Instant.now()) || !entry.sessionId().equals(sessionId)) {
            cache.remove(oldTokenHash, entry);
            return Optional.empty();
        }
        return Optional.of(entry);
    }
}
