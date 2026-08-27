package com.mailflow.config.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        String json = String.format(
                "{\"type\":\"https://mailflow.dev/problems/unauthorized\",\"title\":\"Yêu cầu không được phép\",\"status\":401,\"code\":\"UNAUTHORIZED\",\"detail\":\"Bạn cần đăng nhập để truy cập tài nguyên này.\",\"instance\":\"%s\",\"requestId\":\"%s\",\"timestamp\":\"%s\"}",
                request.getRequestURI(),
                UUID.randomUUID(),
                Instant.now()
        );

        response.getWriter().write(json);
    }
}
