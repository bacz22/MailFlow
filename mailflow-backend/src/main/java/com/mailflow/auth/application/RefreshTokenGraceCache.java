package com.mailflow.auth.application;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenGraceCache {

    void put(String oldTokenHash, String newRawToken, UUID sessionId);

    Optional<GraceEntry> getValid(String oldTokenHash, UUID sessionId);

    record GraceEntry(String newRawToken, UUID sessionId, Instant expiresAt) {
    }
}
