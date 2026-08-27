package com.mailflow.config.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "mailflow.auth")
public class JwtProperties {

    private String issuer = "mailflow-api";
    private String audience = "mailflow-api";
    private Duration accessTokenTtl = Duration.ofMinutes(15);
    private Duration refreshTokenTtl = Duration.ofDays(7);
    private Duration rememberMeRefreshTokenTtl = Duration.ofDays(30);
    private String refreshCookieName = "mf_refresh";
    private boolean refreshCookieSecure = false;
    private String keyId = "mailflow-auth-local";
    private String privateKey;
    private String publicKey;
}
