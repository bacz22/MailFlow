package com.mailflow.engagement.application;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
public class PublicTrackingUrls {

    private final String publicApiBase;
    private final EngagementTokenService tokenService;

    public PublicTrackingUrls(
            @Value("${mailflow.app.public-api-url:http://localhost:8080}") String publicApiBase,
            EngagementTokenService tokenService
    ) {
        this.publicApiBase = trimTrailingSlash(publicApiBase);
        this.tokenService = tokenService;
    }

    public String unsubscribeUrl(UUID workspaceId, UUID campaignId, UUID contactId) {
        String token = tokenService.sign(
                EngagementTokenService.Purpose.UNSUB, workspaceId, campaignId, contactId);
        // Token is base64url + '.' — already URL-safe
        return publicApiBase + "/t/unsubscribe?token=" + token;
    }

    public String unsubscribeOneClickUrl(UUID workspaceId, UUID campaignId, UUID contactId) {
        // Same URI as GET confirm page — RFC 8058 POSTs here
        return unsubscribeUrl(workspaceId, campaignId, contactId);
    }

    public String openPixelUrl(UUID workspaceId, UUID campaignId, UUID contactId) {
        String token = tokenService.sign(
                EngagementTokenService.Purpose.OPEN, workspaceId, campaignId, contactId);
        return publicApiBase + "/t/o/" + token + ".gif";
    }

    public String clickRedirectUrl(UUID workspaceId, UUID campaignId, UUID contactId, String targetUrl) {
        String token = tokenService.sign(
                EngagementTokenService.Purpose.CLICK, workspaceId, campaignId, contactId);
        return publicApiBase + "/t/c/" + token + "?u=" + encode(targetUrl);
    }

    private static String encode(String value) {
        return UriUtils.encode(value, StandardCharsets.UTF_8);
    }

    private static String trimTrailingSlash(String base) {
        if (base == null || base.isBlank()) {
            return "http://localhost:8080";
        }
        String trimmed = base.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }
}
