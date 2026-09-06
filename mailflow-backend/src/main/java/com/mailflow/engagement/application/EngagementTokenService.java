package com.mailflow.engagement.application;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;

@Service
public class EngagementTokenService {

    public enum Purpose {
        UNSUB,
        OPEN,
        CLICK
    }

    public record TokenPayload(
            Purpose purpose,
            UUID workspaceId,
            UUID campaignId,
            UUID contactId
    ) {}

    private final byte[] secret;

    public EngagementTokenService(
            @Value("${mailflow.tracking.hmac-secret:mailflow-tracking-dev-secret-change-me}") String secret
    ) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String sign(Purpose purpose, UUID workspaceId, UUID campaignId, UUID contactId) {
        String payload = purpose.name() + "|" + workspaceId + "|" + campaignId + "|" + contactId;
        String body = base64Url(payload.getBytes(StandardCharsets.UTF_8));
        String sig = base64Url(hmac(payload));
        return body + "." + sig;
    }

    public TokenPayload verify(String token, Purpose expected) {
        if (token == null || token.isBlank() || !token.contains(".")) {
            throw new IllegalArgumentException("TOKEN_INVALID");
        }
        String[] parts = token.split("\\.", 2);
        if (parts.length != 2) {
            throw new IllegalArgumentException("TOKEN_INVALID");
        }
        String payloadJson;
        try {
            payloadJson = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("TOKEN_INVALID");
        }
        String expectedSig = base64Url(hmac(payloadJson));
        if (!constantTimeEquals(expectedSig, parts[1])) {
            throw new IllegalArgumentException("TOKEN_INVALID");
        }
        String[] fields = payloadJson.split("\\|", 4);
        if (fields.length != 4) {
            throw new IllegalArgumentException("TOKEN_INVALID");
        }
        Purpose purpose = Purpose.valueOf(fields[0].toUpperCase(Locale.ROOT));
        if (purpose != expected) {
            throw new IllegalArgumentException("TOKEN_PURPOSE_MISMATCH");
        }
        return new TokenPayload(
                purpose,
                UUID.fromString(fields[1]),
                UUID.fromString(fields[2]),
                UUID.fromString(fields[3])
        );
    }

    private byte[] hmac(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new IllegalStateException("HMAC_FAILED", ex);
        }
    }

    private static String base64Url(byte[] raw) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}
