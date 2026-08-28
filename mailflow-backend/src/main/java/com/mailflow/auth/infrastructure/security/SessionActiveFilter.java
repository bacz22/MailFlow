package com.mailflow.auth.infrastructure.security;

import com.mailflow.auth.application.AuthSessionStatusService;
import com.mailflow.common.security.SecurityErrorWriter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SessionActiveFilter extends OncePerRequestFilter {

    private static final Set<String> SKIP_PATHS = Set.of(
            "/api/v1/auth/register",
            "/api/v1/auth/verify-email",
            "/api/v1/auth/resend-verification",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout",
            "/actuator/health",
            "/actuator/info",
            "/error"
    );

    private final AuthSessionStatusService authSessionStatusService;
    private final SecurityErrorWriter securityErrorWriter;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null) {
            return true;
        }
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }
        return SKIP_PATHS.contains(path);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth) || !jwtAuth.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        Object principal = jwtAuth.getPrincipal();
        if (!(principal instanceof Jwt jwt)) {
            filterChain.doFilter(request, response);
            return;
        }

        String sid = jwt.getClaimAsString("sid");
        if (sid == null || sid.isBlank()) {
            securityErrorWriter.write(
                    request,
                    response,
                    HttpStatus.UNAUTHORIZED,
                    "SESSION_REVOKED",
                    "Phiên đăng nhập không hợp lệ",
                    "Access token không gắn với phiên đăng nhập hợp lệ."
            );
            SecurityContextHolder.clearContext();
            return;
        }

        UUID sessionId;
        try {
            sessionId = UUID.fromString(sid);
        } catch (IllegalArgumentException ex) {
            securityErrorWriter.write(
                    request,
                    response,
                    HttpStatus.UNAUTHORIZED,
                    "SESSION_REVOKED",
                    "Phiên đăng nhập không hợp lệ",
                    "Access token không gắn với phiên đăng nhập hợp lệ."
            );
            SecurityContextHolder.clearContext();
            return;
        }

        if (!authSessionStatusService.isSessionActive(sessionId)) {
            securityErrorWriter.write(
                    request,
                    response,
                    HttpStatus.UNAUTHORIZED,
                    "SESSION_REVOKED",
                    "Phiên đăng nhập đã bị thu hồi",
                    "Phiên đăng nhập đã bị thu hồi hoặc đã hết thời gian hiệu lực."
            );
            SecurityContextHolder.clearContext();
            return;
        }

        filterChain.doFilter(request, response);
    }
}
