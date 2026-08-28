package com.mailflow.infrastructure.config;

import com.mailflow.auth.infrastructure.jwt.JwtProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductionSecurityValidator implements ApplicationRunner {

    private final Environment environment;
    private final JwtProperties jwtProperties;
    private final MailflowWebProperties mailflowWebProperties;
    private final ObjectProvider<RedisConnectionFactory> redisConnectionFactory;

    @Override
    public void run(ApplicationArguments args) {
        if (!environment.acceptsProfiles(Profiles.of("prod", "production"))) {
            return;
        }

        if (!jwtProperties.isRefreshCookieSecure()) {
            throw new IllegalStateException(
                    "REFRESH_COOKIE_SECURE phải là true trên môi trường Production."
            );
        }

        if (mailflowWebProperties.hasOnlyLoopbackCorsOrigins()) {
            throw new IllegalStateException(
                    "CORS origin trên Production không được chỉ còn localhost. " +
                    "Hãy cấu hình APP_CLIENT_URL hoặc CORS_ALLOWED_ORIGINS."
            );
        }

        pingRedis();
    }

    private void pingRedis() {
        RedisConnectionFactory factory = redisConnectionFactory.getIfAvailable();
        if (factory == null) {
            throw new IllegalStateException(
                    "Redis phải khả dụng trên môi trường Production."
            );
        }
        try (RedisConnection connection = factory.getConnection()) {
            connection.ping();
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Không kết nối được Redis trên môi trường Production.",
                    ex
            );
        }
    }
}
