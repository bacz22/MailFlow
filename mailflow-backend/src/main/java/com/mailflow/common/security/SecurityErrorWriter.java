package com.mailflow.common.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

@Component
public class SecurityErrorWriter {

    public void write(
            HttpServletRequest request,
            HttpServletResponse response,
            HttpStatus status,
            String code,
            String title,
            String detail
    ) throws IOException {
        if (response.isCommitted()) {
            return;
        }
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        String requestId = request.getHeader("X-Request-Id");
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        String type = "https://mailflow.dev/problems/" + code.toLowerCase().replace('_', '-');
        String json = "{"
                + "\"type\":\"" + escape(type) + "\","
                + "\"title\":\"" + escape(title) + "\","
                + "\"status\":" + status.value() + ","
                + "\"code\":\"" + escape(code) + "\","
                + "\"detail\":\"" + escape(detail) + "\","
                + "\"instance\":\"" + escape(request.getRequestURI()) + "\","
                + "\"requestId\":\"" + escape(requestId) + "\","
                + "\"timestamp\":\"" + Instant.now() + "\""
                + "}";

        response.getWriter().write(json);
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
