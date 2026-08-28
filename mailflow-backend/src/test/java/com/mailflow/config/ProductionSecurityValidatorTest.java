package com.mailflow.config;

import com.mailflow.auth.infrastructure.jwt.JwtProperties;
import com.mailflow.infrastructure.config.MailflowWebProperties;
import com.mailflow.infrastructure.config.ProductionSecurityValidator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProductionSecurityValidatorTest {

    @Test
    @DisplayName("Prod + cookie Secure=false -> fail fast")
    void prodInsecureCookie_fails() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setRefreshCookieSecure(false);
        MailflowWebProperties webProperties = new MailflowWebProperties();
        webProperties.getApp().setClientUrl("https://app.mailflow.dev");

        ProductionSecurityValidator validator = new ProductionSecurityValidator(
                prodEnvironment(),
                jwtProperties,
                webProperties,
                redisProvider(null)
        );

        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("REFRESH_COOKIE_SECURE");
    }

    @Test
    @DisplayName("Prod + CORS chỉ localhost -> fail fast")
    void prodLocalhostCors_fails() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setRefreshCookieSecure(true);
        MailflowWebProperties webProperties = new MailflowWebProperties();
        webProperties.getApp().setClientUrl("http://localhost:5173");

        ProductionSecurityValidator validator = new ProductionSecurityValidator(
                prodEnvironment(),
                jwtProperties,
                webProperties,
                redisProvider(null)
        );

        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CORS");
    }

    @Test
    @DisplayName("Prod hợp lệ + Redis ping OK -> không throw")
    void prodValid_ok() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setRefreshCookieSecure(true);
        MailflowWebProperties webProperties = new MailflowWebProperties();
        webProperties.getApp().setClientUrl("https://app.mailflow.dev");

        ProductionSecurityValidator validator = new ProductionSecurityValidator(
                prodEnvironment(),
                jwtProperties,
                webProperties,
                redisProvider(pingableRedis())
        );

        validator.run(null);
        assertThat(webProperties.hasOnlyLoopbackCorsOrigins()).isFalse();
    }

    @Test
    @DisplayName("Prod không có Redis -> fail fast")
    void prodRedisMissing_fails() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setRefreshCookieSecure(true);
        MailflowWebProperties webProperties = new MailflowWebProperties();
        webProperties.getApp().setClientUrl("https://app.mailflow.dev");

        ProductionSecurityValidator validator = new ProductionSecurityValidator(
                prodEnvironment(),
                jwtProperties,
                webProperties,
                redisProvider(null)
        );

        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Redis");
    }

    @Test
    @DisplayName("Prod ping Redis thất bại -> fail fast")
    void prodRedisPingFails_fails() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setRefreshCookieSecure(true);
        MailflowWebProperties webProperties = new MailflowWebProperties();
        webProperties.getApp().setClientUrl("https://app.mailflow.dev");

        RedisConnectionFactory factory = mock(RedisConnectionFactory.class);
        when(factory.getConnection()).thenThrow(new IllegalStateException("Connection refused"));

        ProductionSecurityValidator validator = new ProductionSecurityValidator(
                prodEnvironment(),
                jwtProperties,
                webProperties,
                redisProvider(factory)
        );

        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Redis");
    }

    private static Environment prodEnvironment() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        assertThat(environment.acceptsProfiles(Profiles.of("prod", "production"))).isTrue();
        return environment;
    }

    @SuppressWarnings("unchecked")
    private static ObjectProvider<RedisConnectionFactory> redisProvider(RedisConnectionFactory factory) {
        ObjectProvider<RedisConnectionFactory> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(factory);
        return provider;
    }

    private static RedisConnectionFactory pingableRedis() {
        RedisConnectionFactory factory = mock(RedisConnectionFactory.class);
        RedisConnection connection = mock(RedisConnection.class);
        when(factory.getConnection()).thenReturn(connection);
        when(connection.ping()).thenReturn("PONG");
        return factory;
    }
}
