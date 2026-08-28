package com.mailflow.auth.application;

import com.mailflow.auth.domain.model.AuthSession;
import com.mailflow.auth.domain.repository.AuthSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthSessionStatusService {

    private static final Duration CACHE_TTL = Duration.ofSeconds(20);

    private final AuthSessionRepository authSessionRepository;
    private final ConcurrentHashMap<UUID, CacheEntry> cache = new ConcurrentHashMap<>();

    public boolean isSessionActive(UUID sessionId) {
        CacheEntry cached = cache.get(sessionId);
        if (cached != null && cached.expiresAt().isAfter(Instant.now())) {
            return cached.active();
        }

        boolean active = authSessionRepository.findById(sessionId)
                .filter(AuthSession::isActive)
                .isPresent();
        cache.put(sessionId, new CacheEntry(active, Instant.now().plus(CACHE_TTL)));
        return active;
    }

    public void invalidate(UUID sessionId) {
        if (sessionId != null) {
            cache.remove(sessionId);
        }
    }

    public void invalidateAll(Iterable<UUID> sessionIds) {
        for (UUID sessionId : sessionIds) {
            invalidate(sessionId);
        }
    }

    Map<UUID, CacheEntry> cacheView() {
        return cache;
    }

    record CacheEntry(boolean active, Instant expiresAt) {
    }
}
