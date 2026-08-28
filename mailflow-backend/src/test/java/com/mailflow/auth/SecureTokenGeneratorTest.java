package com.mailflow.auth;

import com.mailflow.auth.infrastructure.token.SecureTokenGenerator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

class SecureTokenGeneratorTest {

    private final SecureTokenGenerator generator = new SecureTokenGenerator();

    @Test
    @DisplayName("SecureTokenGenerator sinh token 32 bytes URL-safe không padding")
    void generateRawToken_validFormat() {
        String token = generator.generateRawToken();

        assertThat(token).isNotBlank();
        assertThat(token).doesNotContain("=").doesNotContain("+").doesNotContain("/");

        byte[] decoded = Base64.getUrlDecoder().decode(token);
        assertThat(decoded).hasSize(32);
    }

    @Test
    @DisplayName("SecureTokenGenerator băm SHA-256 chính xác và nhất quán")
    void hashToken_deterministic() {
        String rawToken = "my_secure_random_token_12345";
        String hash1 = generator.hashToken(rawToken);
        String hash2 = generator.hashToken(rawToken);

        assertThat(hash1).isNotBlank().hasSize(64); // SHA-256 Hex 64 ký tự
        assertThat(hash1).isEqualTo(hash2);
    }
}
