package com.mailflow.auth.infrastructure.jwt;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.List;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class JwtConfig {

    private final JwtProperties jwtProperties;
    private final Environment environment;

    @Bean
    public RSAKey rsaKey() {
        boolean hasKeysConfigured = jwtProperties.getPrivateKey() != null && !jwtProperties.getPrivateKey().isBlank()
                && jwtProperties.getPublicKey() != null && !jwtProperties.getPublicKey().isBlank();

        if (hasKeysConfigured) {
            try {
                RSAPublicKey publicKey = parsePublicKey(jwtProperties.getPublicKey());
                RSAPrivateKey privateKey = parsePrivateKey(jwtProperties.getPrivateKey());

                return new RSAKey.Builder(publicKey)
                        .privateKey(privateKey)
                        .keyID(jwtProperties.getKeyId())
                        .algorithm(JWSAlgorithm.RS256)
                        .build();
            } catch (Exception e) {
                log.error("Lỗi khởi tạo RSA Key từ cấu hình: {}", e.getMessage(), e);
                throw new IllegalStateException("Không thể load RSA keys từ cấu hình", e);
            }
        }

        // Kiểm tra nếu đang chạy ở profile Production mà không có key cấu hình -> Fail Fast
        if (environment.acceptsProfiles(Profiles.of("prod", "production"))) {
            throw new IllegalStateException("❌ LỖI BẢO MẬT: Bắt buộc phải cấu hình JWT_PRIVATE_KEY và JWT_PUBLIC_KEY trên môi trường Production! Không được sử dụng key tự sinh.");
        }

        // Tự động sinh RSA KeyPair (2048 bit) cho môi trường Dev/Local/Test nếu chưa có key PEM
        log.warn("⚠️ [DEV/LOCAL MODE] Tự động sinh RSA KeyPair (2048-bit) trong bộ nhớ cho KeyID [{}]. (Không dùng cho Production)", jwtProperties.getKeyId());
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            KeyPair keyPair = keyPairGenerator.generateKeyPair();

            return new RSAKey.Builder((RSAPublicKey) keyPair.getPublic())
                    .privateKey((RSAPrivateKey) keyPair.getPrivate())
                    .keyID(jwtProperties.getKeyId())
                    .algorithm(JWSAlgorithm.RS256)
                    .build();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("RSA algorithm không khả dụng", e);
        }
    }

    @Bean
    public JWKSource<SecurityContext> jwkSource(RSAKey rsaKey) {
        JWKSet jwkSet = new JWKSet(rsaKey);
        return new ImmutableJWKSet<>(jwkSet);
    }

    @Bean
    public JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }

    @Bean
    public JwtDecoder jwtDecoder(RSAKey rsaKey) throws JOSEException {
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey()).build();

        OAuth2TokenValidator<Jwt> defaultTimeValidator = new JwtTimestampValidator(Duration.ofSeconds(30));
        OAuth2TokenValidator<Jwt> issuerValidator = new JwtClaimValidator<String>(
                "iss",
                iss -> iss != null && iss.equals(jwtProperties.getIssuer())
        );
        OAuth2TokenValidator<Jwt> audienceValidator = new JwtClaimValidator<List<String>>(
                "aud",
                aud -> aud != null && aud.contains(jwtProperties.getAudience())
        );
        OAuth2TokenValidator<Jwt> headerTypeValidator = token -> {
            Object typ = token.getHeaders().get("typ");
            if (typ != null && "at+JWT".equals(typ.toString())) {
                return OAuth2TokenValidatorResult.success();
            }
            return OAuth2TokenValidatorResult.failure(new OAuth2Error(
                    "invalid_token",
                    "Header 'typ' phải là 'at+JWT'",
                    null
            ));
        };

        OAuth2TokenValidator<Jwt> combinedValidator = new DelegatingOAuth2TokenValidator<>(
                defaultTimeValidator,
                issuerValidator,
                audienceValidator,
                headerTypeValidator
        );

        jwtDecoder.setJwtValidator(combinedValidator);
        return jwtDecoder;
    }

    private RSAPublicKey parsePublicKey(String keyPem) throws Exception {
        String cleanPem = keyPem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] keyBytes = Base64.getDecoder().decode(cleanPem);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return (RSAPublicKey) keyFactory.generatePublic(spec);
    }

    private RSAPrivateKey parsePrivateKey(String keyPem) throws Exception {
        String cleanPem = keyPem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] keyBytes = Base64.getDecoder().decode(cleanPem);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return (RSAPrivateKey) keyFactory.generatePrivate(spec);
    }
}
