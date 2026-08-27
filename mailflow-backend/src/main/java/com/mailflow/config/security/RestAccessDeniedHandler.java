package com.mailflow.config.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        String json = String.format(
                "{\"type\":\"https://mailflow.dev/problems/forbidden\",\"title\":\"Không có quyền truy cập\",\"status\":403,\"code\":\"FORBIDDEN\",\"detail\":\"Bạn không có quyền thực hiện thao tác này.\",\"instance\":\"%s\",\"requestId\":\"%s\",\"timestamp\":\"%s\"}",
                request.getRequestURI(),
                UUID.randomUUID(),
                Instant.now()
        );

        response.getWriter().write(json);
    }
}
