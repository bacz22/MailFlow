package com.mailflow.auth.infrastructure.security;

import com.mailflow.common.security.SecurityErrorWriter;
import com.mailflow.common.web.ClientIpResolver;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
@RequiredArgsConstructor
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Duration WINDOW = Duration.ofMinutes(1);

    private static final Map<String, Integer> LIMITS = Map.of(
            "/api/v1/auth/login", 10,
            "/api/v1/auth/register", 5,
            "/api/v1/auth/resend-verification", 3,
            "/api/v1/auth/verify-email", 10,
            "/api/v1/auth/forgot-password", 3,
            "/api/v1/auth/reset-password", 10
    );

    private final SecurityErrorWriter securityErrorWriter;
    private final ConcurrentHashMap<String, Deque<Long>> hitsByKey = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!HttpMethod.POST.matches(request.getMethod())) {
            return true;
        }
        return !LIMITS.containsKey(normalizedPath(request));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String path = normalizedPath(request);
        int limit = LIMITS.get(path);
        String clientIp = clientIp(request);
        String key = clientIp + ":" + path;

        if (!tryAcquire(key, limit)) {
            securityErrorWriter.write(
                    request,
                    response,
                    HttpStatus.TOO_MANY_REQUESTS,
                    "RATE_LIMITED",
                    "Quá nhiều yêu cầu",
                    "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau một phút."
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean tryAcquire(String key, int limit) {
        long now = System.currentTimeMillis();
        long cutoff = now - WINDOW.toMillis();
        Deque<Long> hits = hitsByKey.computeIfAbsent(key, ignored -> new ConcurrentLinkedDeque<>());
        synchronized (hits) {
            while (!hits.isEmpty() && hits.peekFirst() < cutoff) {
                hits.pollFirst();
            }
            if (hits.size() >= limit) {
                return false;
            }
            hits.addLast(now);
            return true;
        }
    }

    private static String normalizedPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) {
            return "";
        }
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath)) {
            return uri.substring(contextPath.length());
        }
        return uri;
    }

    private static String clientIp(HttpServletRequest request) {
        return ClientIpResolver.resolve(request);
    }
}
