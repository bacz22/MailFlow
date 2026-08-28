package com.mailflow.infrastructure.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "mailflow")
public class MailflowWebProperties {

    private final App app = new App();
    private final Cors cors = new Cors();

    @Getter
    @Setter
    public static class App {
        private String clientUrl = "http://localhost:5173";
    }

    @Getter
    @Setter
    public static class Cors {
        /**
         * Extra origins, comma-separated. Combined with {@code mailflow.app.client-url}.
         */
        private String allowedOrigins = "";
    }

    public List<String> resolvedCorsOrigins() {
        Set<String> origins = new LinkedHashSet<>();
        addOrigin(origins, app.getClientUrl());
        if (cors.getAllowedOrigins() != null && !cors.getAllowedOrigins().isBlank()) {
            Arrays.stream(cors.getAllowedOrigins().split(","))
                    .forEach(origin -> addOrigin(origins, origin));
        }
        return List.copyOf(origins);
    }

    public boolean hasOnlyLoopbackCorsOrigins() {
        List<String> origins = resolvedCorsOrigins();
        if (origins.isEmpty()) {
            return true;
        }
        return origins.stream().allMatch(MailflowWebProperties::isLoopbackOrigin);
    }

    static boolean isLoopbackOrigin(String origin) {
        if (origin == null || origin.isBlank()) {
            return true;
        }
        String normalized = origin.trim().toLowerCase();
        return normalized.contains("://localhost") || normalized.contains("://127.0.0.1");
    }

    private static void addOrigin(Set<String> origins, String origin) {
        if (origin == null) {
            return;
        }
        String trimmed = origin.trim();
        if (!trimmed.isEmpty()) {
            origins.add(trimmed);
        }
    }
}
